#pragma once

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

#define WATCH_LAYOUT_SLOT_COUNT 5
enum { WATCH_PANEL_ENTRY_MS=132, WATCH_PANEL_ENTRY_DISTANCE=10 };

enum { WATCH_CLOCK_FOLLOW=0, WATCH_CLOCK_12=12, WATCH_CLOCK_24=24, WATCH_CLOCK_QUERY=255 };
static inline uint8_t watch_clock_format(int stored,int legacy) {
  if(stored==WATCH_CLOCK_FOLLOW||stored==WATCH_CLOCK_12||stored==WATCH_CLOCK_24)return (uint8_t)stored;
  return legacy<0?WATCH_CLOCK_FOLLOW:legacy?WATCH_CLOCK_12:WATCH_CLOCK_24;
}
static inline bool watch_clock_uses_12(unsigned format,bool system_24) {
  return format==WATCH_CLOCK_12||(format==WATCH_CLOCK_FOLLOW&&!system_24);
}

typedef struct {
  float clock_x, clock_y, clock_size, date_x, date_y;
  float row_y, number_size, label_y;
  float context, music, notice, peek;
} WatchPose;

static inline float watch_clamp(float value) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

static inline float watch_lerp(float first, float last, float amount) {
  return first + (last - first) * amount;
}

/* A Weather-style short vertical entry, with stock quadratic EaseOut and no
 * overshoot. Header/readings are never part of this presentation offset. */
static inline int watch_panel_offset(uint32_t elapsed) {
  if(elapsed>=WATCH_PANEL_ENTRY_MS)return 0;
  const uint32_t remaining=WATCH_PANEL_ENTRY_MS-elapsed;
  const uint32_t denominator=WATCH_PANEL_ENTRY_MS*WATCH_PANEL_ENTRY_MS;
  return (WATCH_PANEL_ENTRY_DISTANCE*remaining*remaining+denominator/2)/denominator;
}

static inline WatchPose watch_pose_idle(void) {
  return (WatchPose){100,110,80,100,31,
    164,40,44,0,0,0,0};
}

static inline WatchPose watch_pose_context(bool notice) {
  return (WatchPose){58,42,42,158,36,
    66,28,34,1,notice?0:1,notice?1:0,0};
}

static inline WatchPose watch_pose_peek(void) {
  return (WatchPose){100,91,68,100,31,
    129,28,34,0,0,0,1};
}

static inline WatchPose watch_pose_summary(void) {
  WatchPose pose=watch_pose_peek();
  pose.peek=0;pose.notice=1;
  return pose;
}

static inline float watch_context_visibility(WatchPose pose) {
  return watch_clamp(pose.music+pose.notice);
}

// Pebble owns the Peek reveal. Keep one fitted unobstructed composition while
// its height changes; do not independently sweep the clock/date across it.
static inline WatchPose watch_pose_at_height(WatchPose full, int height) {
  return height>=228?full:watch_pose_peek();
}

// Used while fitting text to a pixel width, never as a fixed character limit.
static inline bool watch_layout_pop_utf8(char *text) {
  if (text == NULL) { return false; }
  size_t length = strlen(text);
  if (length == 0) { return false; }
  size_t at = length - 1;
  while (at > 0 && ((unsigned char)text[at] & 0xc0) == 0x80) { --at; }
  text[at] = '\0';
  return true;
}

// Copy whole UTF-8 characters for the compact localized weekday header.
static inline void watch_layout_abbreviate(const char *source, char *result,
                                            size_t capacity, size_t characters) {
  if (capacity == 0) { return; }
  size_t at = 0;
  while (source != NULL && *source && characters) {
    size_t bytes = 1;
    while (source[bytes] && ((unsigned char)source[bytes] & 0xc0) == 0x80) { ++bytes; }
    if (at + bytes >= capacity) { break; }
    memcpy(result + at, source, bytes);
    at += bytes;
    source += bytes;
    --characters;
  }
  result[at] = '\0';
}

static inline void watch_layout_copy_utf8(const char *source, char *result, size_t capacity) {
  // The byte capacity also bounds the maximum number of complete characters.
  watch_layout_abbreviate(source,result,capacity,capacity);
}

static inline bool watch_layout_split_time(const char *text,
                                           char hours[3], char minutes[3]) {
  if (hours == NULL || minutes == NULL) { return false; }
  hours[0] = minutes[0] = '\0';
  if (text == NULL) { return false; }
  size_t length = 0;
  while (length < 6 && text[length]) { ++length; }
  if (length != 4 && length != 5) { return false; }
  const size_t colon = length - 3;
  if (text[colon] != ':' || text[colon + 1] < '0' || text[colon + 1] > '5' ||
      text[colon + 2] < '0' || text[colon + 2] > '9') { return false; }
  int hour = 0;
  for (size_t i = 0; i < colon; ++i) {
    if (text[i] < '0' || text[i] > '9') { return false; }
    hour = hour * 10 + text[i] - '0';
  }
  if (hour > 23) { return false; }
  memcpy(hours, text, colon);
  hours[colon] = '\0';
  memcpy(minutes, text + colon + 1, 2);
  minutes[2] = '\0';
  return true;
}
