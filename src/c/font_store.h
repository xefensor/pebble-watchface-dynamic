#pragma once

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

enum {
  FONT_WATCHFACE, FONT_CLOCK, FONT_DATE, FONT_READINGS, FONT_ACTIVITIES, FONT_ROLES,
  FONT_DEFAULT = 0, FONT_GOTHIC = 1, FONT_BITHAM = 2, FONT_LECO = 3,
  FONT_UNITS = 1024, FONT_MAX_POINTS = 256, FONT_MAX_CONTOURS = 16,
  FONT_REPLY_BYTES = 16,
};

typedef struct {
  uint16_t advance, offset, bytes;
  int16_t left, right, bottom, top;
  uint8_t slot;
} FontGlyph;

static inline uint32_t font_choice(const uint32_t choices[FONT_ROLES], unsigned role) {
  return choices[role] ? choices[role] : choices[FONT_WATCHFACE];
}

static inline bool font_choices_valid(const uint32_t choices[FONT_ROLES]) {
  for (unsigned i = 0; i < FONT_ROLES; ++i) {
    if (i != FONT_CLOCK && (choices[i] == FONT_BITHAM || choices[i] == FONT_LECO)) return false;
  }
  return true;
}
void font_store_load(void);
bool font_store_ready(const uint32_t choices[FONT_ROLES], uint32_t revision);
void font_store_apply(const uint32_t choices[FONT_ROLES]);
void font_store_discard_staged(void);
bool font_store_receive(const uint8_t *data, size_t size, uint8_t reply[FONT_REPLY_BYTES]);
bool font_store_glyph(uint32_t id, uint32_t code, FontGlyph *glyph);
bool font_store_outline(const FontGlyph *glyph, uint8_t *bytes);
