#include <pebble.h>
#include <string.h>
#include "display_preferences.h"
#define DISPLAY_STORAGE_KEY 78
static const uint8_t legacy_keys[10]={2,3,70,75,76,77,72,19,71,73};
static uint32_t get32(const uint8_t *p){return (uint32_t)p[0]|(uint32_t)p[1]<<8|(uint32_t)p[2]<<16|(uint32_t)p[3]<<24;}
static void put32(uint8_t *p,uint32_t value){for(unsigned i=0;i<4;++i)p[i]=(uint8_t)(value>>(i*8));}
bool display_valid(const DisplayPreferences *v){
 if(!v)return false;
 for(unsigned i=0;i<6;++i)if(v->value[i]>0xffffff)return false;
 return (v->value[6]==0||v->value[6]==12||v->value[6]==24)&&v->value[7]<=1&&v->value[8]<=1&&v->value[9]<=2&&v->value[10]<=3&&v->value[11]<=2&&v->value[12]<=1;
}
void display_encode(const DisplayPreferences *v,uint8_t status,uint8_t flags,uint8_t bytes[DISPLAY_BYTES]){
 bytes[0]=1;bytes[1]=DISPLAY_FIELDS;bytes[2]=status;bytes[3]=flags;put32(bytes+4,v->revision);
 for(unsigned i=0;i<DISPLAY_FIELDS;++i)put32(bytes+8+i*4,v->value[i]);
}
bool display_decode(const uint8_t *bytes,size_t size,DisplayPreferences *v,uint8_t *status,uint8_t *flags){
 if(!bytes||size!=DISPLAY_BYTES||bytes[0]!=1||bytes[1]!=DISPLAY_FIELDS||bytes[2]>1||bytes[3]>1)return false;
 DisplayPreferences result;result.revision=get32(bytes+4);
 for(unsigned i=0;i<DISPLAY_FIELDS;++i)result.value[i]=get32(bytes+8+i*4);
 if(!display_valid(&result))return false;
 *v=result;if(status)*status=bytes[2];if(flags)*flags=bytes[3];return true;
}
void display_load(DisplayPreferences *v){
 *v=(DisplayPreferences){.value={0xffffff,0,0x55aaff,0,0xffffff,0x55aaff,0,1,1,0,0,DISPLAY_EXPLICIT,0}};
 for(unsigned i=0;i<10;++i)if(persist_exists(legacy_keys[i])){
  const uint32_t old=(i==7||i==8)?persist_read_bool(legacy_keys[i]):(uint32_t)persist_read_int(legacy_keys[i]);
  DisplayPreferences candidate=*v;candidate.value[i]=old;if(display_valid(&candidate))*v=candidate;
 }
 if(!persist_exists(72)&&persist_exists(7))v->value[6]=persist_read_bool(7)?12:24;
 if(persist_read_bool(74))v->value[11]=DISPLAY_QUIET;
 uint8_t bytes[DISPLAY_BYTES],status,flags;DisplayPreferences stored;
 if(persist_get_size(DISPLAY_STORAGE_KEY)==DISPLAY_BYTES&&persist_read_data(DISPLAY_STORAGE_KEY,bytes,sizeof(bytes))==DISPLAY_BYTES&&display_decode(bytes,sizeof(bytes),&stored,&status,&flags)&&!status&&!flags)*v=stored;
}
bool display_save(const DisplayPreferences *v){
 if(!display_valid(v))return false;
 uint8_t bytes[DISPLAY_BYTES],check[DISPLAY_BYTES];display_encode(v,0,0,bytes);
 const bool same=persist_read_data(DISPLAY_STORAGE_KEY,check,sizeof(check))==DISPLAY_BYTES&&!memcmp(bytes,check,sizeof(bytes));
 if(!same&&persist_write_data(DISPLAY_STORAGE_KEY,bytes,sizeof(bytes))!=DISPLAY_BYTES)return false;
 if(persist_get_size(DISPLAY_STORAGE_KEY)!=DISPLAY_BYTES||persist_read_data(DISPLAY_STORAGE_KEY,check,sizeof(check))!=DISPLAY_BYTES||memcmp(bytes,check,sizeof(bytes)))return false;
 // The verified snapshot owns all native choices; retain earlier builds' mirrors.
 for(unsigned i=0;i<10;++i){
  const bool boolean=i==7||i==8;const uint32_t old=boolean?persist_read_bool(legacy_keys[i]):(uint32_t)persist_read_int(legacy_keys[i]);
  if(persist_exists(legacy_keys[i])&&old==v->value[i])continue;
  if(boolean)persist_write_bool(legacy_keys[i],v->value[i]);else persist_write_int(legacy_keys[i],(int32_t)v->value[i]);
 }
 const bool night=v->value[DISPLAY_MODE]==DISPLAY_QUIET;
 if(!persist_exists(74)||persist_read_bool(74)!=night)persist_write_bool(74,night);
 return true;
}
