"""Exercise the production reading-fit entry point for complete percentages."""
from pathlib import Path
import os, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1]
native=(ROOT/'src/c/dynamic.c').read_text()
start=native.index('static void prv_fit_reading_numbers(WatchPose pose) {')
end=native.index('\nstatic WatchPose prv_reading_pose(',start)
source=r'''
#include <assert.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include <time.h>
#include "reading_layout.h"
#include "generated_clock_glyphs.h"
typedef struct {float number_size;} WatchPose;
typedef struct {unsigned flags;const char *text;} ComplicationSlot;
typedef struct {char number[32],unit[32];} ReadingParts;
typedef struct {int w;} Size;
enum {READING_VALUE=0,COMPLICATION_FLAG_BITMAP=2,COMPLICATION_SEMANTIC_TEMPERATURE=2,COMPLICATION_SEMANTIC_CONDITION=7,COMPLICATION_MAX_TEXT_BYTES=64,COMPLICATION_MAX_LABEL_BYTES=32,READING_PART_BYTES=32};
static bool s_has_complications=true;
static int prv_reading_icon_size(void){return 18;}
static struct {int secondary;} s_type;
static ComplicationSlot slots[2];
static ReadingNumberLayout s_reading_numbers[2];
static const ComplicationSlot *prv_reading_slot(unsigned i){return &slots[i];}
static bool complication_is_selected(const ComplicationSlot *s){(void)s;return true;}
static int reading_state(const ComplicationSlot *s,time_t now){(void)s;(void)now;return READING_VALUE;}
static bool prv_slot_text(const ComplicationSlot *s,char *text,size_t size){snprintf(text,size,"%s",s->text);return true;}
static bool reading_parts(const char *text,ReadingParts *parts){
 const char *unit=strchr(text,'%');size_t n=unit?(size_t)(unit-text):1;
 memcpy(parts->number,text,n);parts->number[n]=0;snprintf(parts->unit,sizeof(parts->unit),"%s",unit?"%":"°C");return true;
}
static unsigned reading_semantic(const ComplicationSlot *s,const ReadingParts *p,bool numeric){(void)s;(void)p;(void)numeric;return COMPLICATION_SEMANTIC_TEMPERATURE;}
static const char *i18n_get_system_locale(void){return "en";}
static void prv_caption(const ComplicationSlot *s,unsigned k,unsigned i,const char *l,char *out,size_t size){(void)s;(void)k;(void)i;(void)l;(void)size;out[0]=0;}
static void reading_native_number(const char *in,char *out,size_t size){snprintf(out,size,"%s",in);}
static float prv_vector_width(const char *text,float point){
 unsigned advance=0;
 for(;*text;++text)for(unsigned i=0;i<CLOCK_GLYPH_COUNT;++i)if(clock_glyphs[i].code==(unsigned char)*text)advance+=clock_glyphs[i].advance;
 return advance*point/CLOCK_FONT_UNITS_PER_EM;
}
static Size prv_measure(const char *text,int point){(void)text;return (Size){point==20?16:point==22?18:22};}
static int prv_round(float n){return (int)(n+.5f);}
'''+native[start:end]+r'''
int main(void){
 const char *percent[]={"0%","9%","40%","99%","100%"};
 const int sizes[]={20,22,26};
 for(unsigned size=0;size<3;++size)for(unsigned p=0;p<5;++p)for(unsigned side=0;side<2;++side)for(int preferred=28;preferred<=40;preferred+=12){
  s_type.secondary=sizes[size];slots[side]=(ComplicationSlot){1,percent[p]};slots[1-side]=(ComplicationSlot){1,"5°C"};
  prv_fit_reading_numbers((WatchPose){preferred});
  assert(!s_reading_numbers[side].overflow);
  assert(!s_reading_numbers[side].unit_below);
  assert(s_reading_numbers[0].point==s_reading_numbers[1].point);
  assert(s_reading_numbers[side].width<=READING_CONTENT_WIDTH);
  assert(s_reading_numbers[side].icon);
 }
 puts("production percentage fitting: both slots, three unit sizes, idle/compact and 0..100% stay inline PASS");return 0;
}
'''
with tempfile.TemporaryDirectory(prefix='dynamic-percent-fit-') as directory:
 folder=Path(directory);(folder/'test.c').write_text(source)
 subprocess.run([os.environ.get('CC','cc'),'-std=c99','-Wall','-Wextra','-Werror','-I'+str(ROOT/'src/c'),str(folder/'test.c'),'-o',str(folder/'test')],check=True)
 subprocess.run([str(folder/'test')],check=True)
