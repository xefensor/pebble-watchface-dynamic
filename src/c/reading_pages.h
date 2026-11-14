#pragma once
#include <stdbool.h>
#include <stdint.h>
static inline unsigned reading_page_slot(unsigned page,unsigned home){return page*2+home;}
static inline bool reading_page_present(uint8_t slots,unsigned page){return page<3&&(slots&(3u<<(page*2)));}
static inline unsigned reading_page_next(uint8_t slots,unsigned current){for(unsigned n=1;n<=3;++n){unsigned page=(current+n)%3;if(reading_page_present(slots,page))return page;}return current;}
static inline bool reading_page_gesture(uint32_t now,uint32_t previous,bool seen,bool focused,bool peek){return focused&&!peek&&(!seen||(uint32_t)(now-previous)>=1000u);}
