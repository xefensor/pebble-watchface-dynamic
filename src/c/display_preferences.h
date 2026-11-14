#pragma once
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
enum { DISPLAY_FIELDS=21,DISPLAY_BYTES=92,DISPLAY_LEGACY_FIELDS=13,DISPLAY_LEGACY_BYTES=60,DISPLAY_APPLIED=0,DISPLAY_SAVE_FAILED=1,DISPLAY_HELLO=1,
 DISPLAY_DAY_BG=0,DISPLAY_DAY_TEXT,DISPLAY_DAY_ACCENT,DISPLAY_NIGHT_BG,DISPLAY_NIGHT_TEXT,DISPLAY_NIGHT_ACCENT,
 DISPLAY_CLOCK,DISPLAY_STATUS,DISPLAY_ANIMATIONS,DISPLAY_VIBRATION,DISPLAY_TEXT_SIZE,DISPLAY_MODE,DISPLAY_MANUAL,
 DISPLAY_SPLIT,DISPLAY_ROWS,DISPLAY_HIDE_TITLES,DISPLAY_SHAKE,DISPLAY_LOWER_DAY_BG,DISPLAY_LOWER_DAY_TEXT,DISPLAY_LOWER_NIGHT_BG,DISPLAY_LOWER_NIGHT_TEXT,
 DISPLAY_FOLLOW=0,DISPLAY_QUIET=1,DISPLAY_EXPLICIT=2 };
typedef struct {uint32_t revision,value[DISPLAY_FIELDS];} DisplayPreferences;
bool display_valid(const DisplayPreferences *value);
void display_encode(const DisplayPreferences *value,uint8_t status,uint8_t flags,uint8_t bytes[DISPLAY_BYTES]);
bool display_decode(const uint8_t *bytes,size_t size,DisplayPreferences *value,uint8_t *status,uint8_t *flags);
void display_load(DisplayPreferences *value);
bool display_save(const DisplayPreferences *value);

void display_encode_legacy(const DisplayPreferences *,uint8_t,uint8_t,uint8_t bytes[DISPLAY_LEGACY_BYTES]);
