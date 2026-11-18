#include <pebble.h>
#include <string.h>
#include "font_store.h"

enum {
  HEADER = 8, ENTRY = 16, PAGE = 256, MAX_SIZE = 65535, MAX_PAGES = 256,
  SLOTS = 2 * FONT_ROLES, CACHE_PAGES = 6, RESERVED_BYTES = 8192,
  BEGIN = 1, CHUNK = 2, OK = 0, INVALID = 1, NO_SPACE = 2, WRITE_FAILED = 3,
};
static const uint32_t FIRST_KEY = 0x464f0000;
typedef struct {
  uint32_t id, revision;
  uint16_t size, count;
} Asset;
typedef struct {
  uint8_t slot;
  uint16_t page, length;
  uint32_t used;
  uint8_t bytes[PAGE];
} PageCache;

static Asset s_assets[SLOTS];
static uint32_t s_active[FONT_ROLES - 1];
static PageCache s_cache[CACHE_PAGES];
static uint32_t s_access, s_revision;
static int s_writing = -1;
static size_t s_offset;

static uint16_t read16(const uint8_t *bytes) {
  return (uint16_t)(bytes[0] | bytes[1] << 8);
}

static uint32_t read32(const uint8_t *bytes) {
  return (uint32_t)read16(bytes) | (uint32_t)read16(bytes + 2) << 16;
}

static void write32(uint8_t *bytes, uint32_t value) {
  for (unsigned i = 0; i < 4; ++i) bytes[i] = (uint8_t)(value >> (8 * i));
}

static uint32_t slot_key(unsigned slot) {
  return FIRST_KEY + slot * (MAX_PAGES + 1);
}

static unsigned page_count(size_t size) {
  return (size + PAGE - 1) / PAGE;
}

static bool active(uint32_t id) {
  for (unsigned i = 0; i < FONT_ROLES - 1; ++i) if (s_active[i] == id) return true;
  return false;
}

static void invalidate(unsigned slot) {
  for (unsigned i = 0; i < CACHE_PAGES; ++i) {
    if (s_cache[i].slot == slot) s_cache[i].used = 0;
  }
}

static void remove_slot(unsigned slot) {
  bool removed = true;
  for (unsigned page = 1; page <= page_count(s_assets[slot].size); ++page) {
    const uint32_t key = slot_key(slot) + page;
    if (persist_exists(key) && persist_delete(key) < 0) removed = false;
  }
  if (removed && (!persist_exists(slot_key(slot)) || persist_delete(slot_key(slot)) >= 0)) {
    s_assets[slot] = (Asset){0};
  } else {
    // Keep the recovery record so a later cleanup can retry.
    s_assets[slot].count = 0;
  }
  invalidate(slot);
}

void font_store_load(void) {
  for (unsigned i = 0; i < SLOTS; ++i) {
    if (persist_read_data(slot_key(i), &s_assets[i], sizeof(Asset)) != sizeof(Asset) ||
        s_assets[i].id <= FONT_LECO || s_assets[i].size < HEADER) {
      s_assets[i] = (Asset){0};
    }
  }
}

static int find_asset(uint32_t id) {
  if (id <= FONT_LECO) return -1;
  for (unsigned i = 0; i < SLOTS; ++i) {
    if (s_assets[i].id == id && s_assets[i].count) return (int)i;
  }
  return -1;
}

static bool read_bytes(unsigned slot, size_t offset, void *target, size_t length) {
  uint8_t *out = target;
  if (offset + length > s_assets[slot].size) return false;
  while (length) {
    const unsigned page = offset / PAGE, from = offset % PAGE;
    PageCache *cache = &s_cache[0];
    for (unsigned i = 0; i < CACHE_PAGES; ++i) {
      PageCache *candidate = &s_cache[i];
      if (candidate->used && candidate->slot == slot && candidate->page == page) {
        cache = candidate;
        break;
      }
      if (candidate->used < cache->used) cache = candidate;
    }
    if (!cache->used || cache->slot != slot || cache->page != page) {
      const int actual = persist_read_data(slot_key(slot) + page + 1, cache->bytes, PAGE);
      if (actual <= 0) {
        cache->used = 0;
        return false;
      }
      cache->slot = slot;
      cache->page = page;
      cache->length = (uint16_t)actual;
    }
    cache->used = ++s_access;
    size_t take = PAGE - from;
    if (take > length) take = length;
    if (from + take > cache->length) return false;
    memcpy(out, cache->bytes + from, take);
    out += take;
    offset += take;
    length -= take;
  }
  return true;
}

static bool header(unsigned slot, uint16_t *count) {
  uint8_t bytes[HEADER];
  if (!read_bytes(slot, 0, bytes, sizeof(bytes)) ||
      memcmp(bytes, "DF\x01\x00", 4) || bytes[6] || bytes[7]) return false;
  *count = read16(bytes + 4);
  return *count && *count <= 384 && HEADER + (size_t)*count * ENTRY <= s_assets[slot].size;
}

static FontGlyph glyph_entry(unsigned slot, const uint8_t *entry) {
  return (FontGlyph){
    .advance = read16(entry + 2), .offset = read16(entry + 12), .bytes = read16(entry + 14),
    .left = (int16_t)read16(entry + 4), .right = (int16_t)read16(entry + 6),
    .bottom = (int16_t)read16(entry + 8), .top = (int16_t)read16(entry + 10),
    .slot = slot,
  };
}

static bool verify_outline(const FontGlyph *glyph) {
  if (glyph->bytes > 4 * FONT_MAX_POINTS + FONT_MAX_CONTOURS) return false;
  uint8_t path[4 * FONT_MAX_POINTS + FONT_MAX_CONTOURS];
  if (!font_store_outline(glyph, path)) return false;
  unsigned at = 0, points = 0, contours = 0;
  while (at < glyph->bytes) {
    const unsigned count = path[at++];
    if (count < 3 || at + 4 * count > glyph->bytes ||
        (points += count) > FONT_MAX_POINTS || ++contours > FONT_MAX_CONTOURS) return false;
    for (unsigned i = 0; i < count; ++i) {
      const int x = (int16_t)read16(path + at), y = (int16_t)read16(path + at + 2);
      if (x < glyph->left || x > glyph->right || y < glyph->bottom || y > glyph->top) return false;
      at += 4;
    }
  }
  return true;
}

static bool verify_asset(unsigned slot, uint16_t *count) {
  if (!header(slot, count)) return false;
  uint32_t hash = 2166136261u;
  uint8_t page[PAGE];
  for (size_t at = 0; at < s_assets[slot].size;) {
    size_t length = s_assets[slot].size - at;
    if (length > sizeof(page)) length = sizeof(page);
    if (!read_bytes(slot, at, page, length)) return false;
    for (unsigned i = 0; i < length; ++i) hash = (hash ^ page[i]) * 16777619u;
    at += length;
  }
  if (hash <= FONT_LECO) hash += 4;
  if (hash != s_assets[slot].id) return false;

  unsigned previous = 0;
  bool has_ink = false;
  size_t expected = HEADER + (size_t)*count * ENTRY;
  for (unsigned i = 0; i < *count; ++i) {
    uint8_t entry[ENTRY];
    if (!read_bytes(slot, HEADER + i * ENTRY, entry, ENTRY)) return false;
    const unsigned code = read16(entry);
    FontGlyph glyph = glyph_entry(slot, entry);
    if (code <= previous || glyph.advance > 4 * FONT_UNITS ||
        glyph.left < -4 * FONT_UNITS || glyph.right > 4 * FONT_UNITS || glyph.left > glyph.right ||
        glyph.bottom < -4 * FONT_UNITS || glyph.top > 4 * FONT_UNITS || glyph.bottom > glyph.top ||
        glyph.offset != expected || expected + glyph.bytes > s_assets[slot].size ||
        !verify_outline(&glyph)) return false;
    has_ink |= glyph.bytes > 0;
    previous = code;
    expected += glyph.bytes;
  }
  return has_ink && expected == s_assets[slot].size;
}

bool font_store_ready(const uint32_t choices[FONT_ROLES], uint32_t revision) {
  for (unsigned role = FONT_CLOCK; role < FONT_ROLES; ++role) {
    const uint32_t id = font_choice(choices, role);
    if (id <= FONT_LECO) continue;
    const int slot = find_asset(id);
    if (slot < 0 || (!active(id) && s_assets[slot].revision != revision)) return false;
  }
  return true;
}

void font_store_discard_staged(void) {
  s_writing = -1;
  s_revision = 0;
  for (unsigned i = 0; i < SLOTS; ++i) {
    if (s_assets[i].id && !active(s_assets[i].id)) remove_slot(i);
  }
}

void font_store_apply(const uint32_t choices[FONT_ROLES]) {
  for (unsigned role = FONT_CLOCK; role < FONT_ROLES; ++role) {
    s_active[role - FONT_CLOCK] = font_choice(choices, role);
  }
  font_store_discard_staged();
}

static unsigned begin(uint32_t revision, uint32_t id, size_t total, size_t *offset) {
  if (total < HEADER || total > MAX_SIZE) return INVALID;
  if (revision != s_revision) {
    font_store_discard_staged();
    s_revision = revision;
  }
  const int installed = find_asset(id);
  if (installed >= 0 && (active(id) || s_assets[installed].revision == revision)) {
    if (s_assets[installed].size != total) return INVALID;
    *offset = total;
    return OK;
  }
  if (s_writing >= 0) {
    const Asset *asset = &s_assets[s_writing];
    if (asset->id == id && asset->size == total) {
      *offset = s_offset;
      return OK;
    }
    remove_slot(s_writing);
    s_writing = -1;
  }
  size_t allocated = RESERVED_BYTES + total + page_count(total) * 16;
  int slot = -1;
  for (unsigned i = 0; i < SLOTS; ++i) {
    if (!s_assets[i].id && slot < 0) slot = i;
    allocated += s_assets[i].size + page_count(s_assets[i].size) * 16;
  }
  if (slot < 0 || allocated > persist_get_max_size()) return NO_SPACE;
  const Asset asset = {.id = id, .revision = revision, .size = total};
  if (persist_write_data(slot_key(slot), &asset, sizeof(asset)) != sizeof(asset)) return WRITE_FAILED;
  s_assets[slot] = asset;
  s_writing = slot;
  s_offset = 0;
  return OK;
}

static unsigned chunk(uint32_t revision, uint32_t id, size_t offset,
                      const uint8_t *data, size_t size, size_t *next) {
  const int installed = find_asset(id);
  if (revision == s_revision && installed >= 0) {
    *next = s_assets[installed].size;
    return OK;
  }
  if (revision != s_revision || s_writing < 0) return INVALID;
  const unsigned slot = s_writing;
  Asset *asset = &s_assets[slot];
  if (asset->id != id || offset > s_offset || !size || size > 1024 ||
      offset % PAGE || offset + size > asset->size ||
      (size % PAGE && offset + size != asset->size)) return INVALID;
  if (offset < s_offset) {
    *next = s_offset;
    return OK;
  }
  for (size_t at = 0; at < size;) {
    const unsigned page = (offset + at) / PAGE;
    const size_t take = size - at < PAGE ? size - at : PAGE;
    if (persist_write_data(slot_key(slot) + page + 1, data + at, take) != (int)take) return WRITE_FAILED;
    at += take;
  }
  s_offset += size;
  invalidate(slot);
  if (s_offset == asset->size) {
    Asset complete = *asset;
    if (!verify_asset(slot, &complete.count)) {
      remove_slot(slot);
      s_writing = -1;
      return INVALID;
    }
    if (persist_write_data(slot_key(slot), &complete, sizeof(complete)) != sizeof(complete)) {
      remove_slot(slot);
      s_writing = -1;
      return WRITE_FAILED;
    }
    *asset = complete;
    s_writing = -1;
  }
  *next = s_offset;
  return OK;
}

bool font_store_receive(const uint8_t *data, size_t size, uint8_t reply[FONT_REPLY_BYTES]) {
  if (!data || size < FONT_REPLY_BYTES || data[0] != 1 || data[2] || data[3]) return false;
  const uint32_t revision = read32(data + 4), id = read32(data + 8), value = read32(data + 12);
  if (!revision || id <= FONT_LECO) return false;
  size_t position = 0;
  unsigned status = INVALID;
  if (data[1] == BEGIN && size == FONT_REPLY_BYTES) status = begin(revision, id, value, &position);
  if (data[1] == CHUNK) status = chunk(revision, id, value, data + FONT_REPLY_BYTES, size - FONT_REPLY_BYTES, &position);
  reply[0] = 1;
  reply[1] = data[1];
  reply[2] = status;
  reply[3] = 0;
  write32(reply + 4, revision);
  write32(reply + 8, id);
  write32(reply + 12, position);
  return true;
}

bool font_store_glyph(uint32_t id, uint32_t code, FontGlyph *glyph) {
  const int slot = find_asset(id);
  if (slot < 0 || code > UINT16_MAX) return false;
  unsigned first = 0, last = s_assets[slot].count;
  while (first < last) {
    const unsigned middle = first + (last - first) / 2;
    uint8_t entry[ENTRY];
    if (!read_bytes(slot, HEADER + middle * ENTRY, entry, ENTRY)) return false;
    const unsigned stored = read16(entry);
    if (stored == code) {
      *glyph = glyph_entry(slot, entry);
      return true;
    }
    if (stored < code) first = middle + 1;
    else last = middle;
  }
  return false;
}

bool font_store_outline(const FontGlyph *glyph, uint8_t *bytes) {
  return read_bytes(glyph->slot, glyph->offset, bytes, glyph->bytes);
}
