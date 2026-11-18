"""Exercise the watch's font staging, deduplication, and garbage collection."""
from pathlib import Path
import os
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
PEBBLE_HEADER = """
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
int persist_read_data(uint32_t key, void *out, size_t size);
int persist_write_data(uint32_t key, const void *in, size_t size);
bool persist_exists(uint32_t key);
int persist_delete(uint32_t key);
size_t persist_get_max_size(void);
"""
HARNESS = r'''
#include <assert.h>
#include <stdio.h>
#include <string.h>
#include "pebble.h"
enum { FIRST = 0x464f0000, KEYS = 2570 };
static unsigned char storage[KEYS][256];
static size_t sizes[KEYS];
static size_t capacity = 1024 * 1024;
static bool fail_data;

bool persist_exists(uint32_t key) {
  assert(key >= FIRST && key - FIRST < KEYS);
  return sizes[key - FIRST] != 0;
}
int persist_read_data(uint32_t key, void *out, size_t size) {
  if (!persist_exists(key)) return -1;
  if (size > sizes[key - FIRST]) size = sizes[key - FIRST];
  memcpy(out,storage[key - FIRST],size);
  return (int)size;
}
int persist_write_data(uint32_t key,const void *in,size_t size) {
  assert(key >= FIRST && key - FIRST < KEYS && size <= 256);
  if (fail_data && (key-FIRST)%257) return -1;
  sizes[key - FIRST] = size;
  memcpy(storage[key - FIRST],in,size);
  return (int)size;
}
int persist_delete(uint32_t key) {
  if (!persist_exists(key)) return -1;
  sizes[key - FIRST] = 0;
  return 0;
}
size_t persist_get_max_size(void) { return capacity; }

#include "font_store.c"

static unsigned keys_in_use(void) {
  unsigned count = 0;
  for (unsigned i = 0; i < KEYS; ++i) count += sizes[i] != 0;
  return count;
}

static void restart(const uint32_t choices[FONT_ROLES]) {
  memset(s_assets,0,sizeof(s_assets));
  memset(s_cache,0,sizeof(s_cache));
  memset(s_active,0,sizeof(s_active));
  font_store_load();
  font_store_apply(choices);
}

static unsigned request(unsigned op,uint32_t revision,uint32_t id,uint32_t position,
                        const uint8_t *data,size_t length,uint32_t *next) {
  uint8_t packet[1040] = {1,op};
  uint8_t reply[FONT_REPLY_BYTES];
  write32(packet+4,revision);
  write32(packet+8,id);
  write32(packet+12,position);
  if (length) memcpy(packet+FONT_REPLY_BYTES,data,length);
  assert(font_store_receive(packet,FONT_REPLY_BYTES+length,reply));
  assert(reply[1]==op && read32(reply+4)==revision && read32(reply+8)==id);
  *next=read32(reply+12);
  return reply[2];
}

static size_t load_fixture(const char *path,uint8_t *bytes,uint32_t *id) {
  FILE *file=fopen(path,"rb");assert(file);
  size_t length=fread(bytes,1,65535,file);assert(feof(file));fclose(file);
  uint32_t hash=2166136261u;
  for (size_t i=0;i<length;++i) hash=(hash^bytes[i])*16777619u;
  *id=hash<=3?hash+4:hash;
  return length;
}

static void upload(uint32_t revision,uint32_t id,const uint8_t *bytes,size_t length) {
  uint32_t next;
  assert(request(1,revision,id,length,NULL,0,&next)==OK && next==0);
  for (size_t at=0;at<length;) {
    size_t take=length-at<1024?length-at:1024;
    assert(request(2,revision,id,at,bytes+at,take,&next)==OK && next==at+take);
    if (at==0) assert(request(2,revision,id,at,bytes+at,take,&next)==OK && next==take);
    at+=take;
  }
}

int main(int argc,char **argv) {
  assert(argc==3);
  static uint8_t primary[65535],replacement[65535];
  uint32_t id,second,next;
  size_t length=load_fixture(argv[1],primary,&id),total=load_fixture(argv[2],replacement,&second);
  uint32_t choices[FONT_ROLES]={id,0,0,id,0};

  capacity=4096;
  assert(request(1,1,id,length,NULL,0,&next)==NO_SPACE && keys_in_use()==0);
  capacity=1024*1024;
  upload(2,id,primary,length);
  assert(!font_store_ready(choices,1) && font_store_ready(choices,2));
  font_store_apply(choices);
  const unsigned active=keys_in_use();
  assert(active==1+(length+255)/256);
  assert(request(1,3,id,length,NULL,0,&next)==OK && next==length && keys_in_use()==active);
  FontGlyph glyph;
  assert(font_store_glyph(id,0x010d,&glyph) && glyph.bytes && glyph.advance);
  restart(choices);
  assert(font_store_glyph(id,0x010d,&glyph));
  assert(keys_in_use()==active);

  // A failed page write preserves the previously applied font across restart.
  assert(request(1,4,second,total,NULL,0,&next)==OK && next==0);
  fail_data=true;
  assert(request(2,4,second,0,replacement,1024,&next)==WRITE_FAILED);
  fail_data=false;
  assert(keys_in_use()==active+1);
  restart(choices);
  assert(keys_in_use()==active && font_store_glyph(id,'0',&glyph));

  // Removing one role keeps the shared copy. Replacing the last role frees it.
  choices[FONT_READINGS]=0;
  font_store_apply(choices);
  assert(keys_in_use()==active);
  upload(5,second,replacement,total);
  choices[FONT_WATCHFACE]=second;
  assert(font_store_ready(choices,5));
  font_store_apply(choices);
  assert(!font_store_glyph(id,'0',&glyph) && font_store_glyph(second,'0',&glyph));
  assert(keys_in_use()==1+(total+255)/256);

  // A global selection with no inheriting role takes up no watch storage.
  for(unsigned role=FONT_CLOCK;role<FONT_ROLES;++role)choices[role]=FONT_GOTHIC;
  assert(font_store_ready(choices,6));
  font_store_apply(choices);
  restart(choices);
  assert(keys_in_use()==0 && !font_store_glyph(second,'0',&glyph));
  choices[FONT_DATE]=FONT_DEFAULT;
  assert(!font_store_ready(choices,7));
  upload(7,second,replacement,total);
  assert(font_store_ready(choices,7));
  font_store_apply(choices);
  assert(font_store_glyph(second,'0',&glyph));

  // Reset and reopen with no writable fonts on the watch.
  memset(choices,0,sizeof(choices));
  font_store_apply(choices);
  restart(choices);
  assert(keys_in_use()==0);
  puts("Native font store: capacity, duplicate chunks, shared font, failed replacement, restart and reset PASS");
}
'''

with tempfile.TemporaryDirectory(prefix="dynamic-native-fonts-") as tmp:
    directory = Path(tmp)
    (directory / "pebble.h").write_text(PEBBLE_HEADER)
    (directory / "test.c").write_text(HARNESS)
    for family in ("RobotoCondensed-Bold", "Fredoka-Bold-Clock"):
        subprocess.run(
            ["node", "--input-type=module", "-e", """
import {readFileSync, writeFileSync} from 'node:fs';
import {create} from 'fontkitten';
import compiler from './src/pkjs/font-compiler.js';
const [source, dest] = process.argv.slice(1);
writeFileSync(dest, compiler.compile(create(readFileSync(source))).bytes);
""", str(ROOT / f"resources/fonts/{family}.ttf"), str(directory / family)],
            cwd=ROOT, check=True,
        )
    executable = directory / "test"
    subprocess.run(
        [os.environ.get("CC", "cc"), "-std=c99", "-Wall", "-Wextra", "-Werror",
         "-I", tmp, "-I", str(ROOT / "src/c"), str(directory / "test.c"), "-o", str(executable)],
        check=True,
    )
    subprocess.run(
        [str(executable), str(directory / "RobotoCondensed-Bold"), str(directory / "Fredoka-Bold-Clock")],
        check=True,
    )
