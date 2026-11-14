#include <assert.h>
#include "../src/c/reading_pages.h"
int main(void){
 assert(reading_page_slot(0,0)==0&&reading_page_slot(1,1)==3&&reading_page_slot(2,0)==4);
 assert(reading_page_next(31,0)==1&&reading_page_next(31,1)==2&&reading_page_next(31,2)==0);
 assert(reading_page_next(17,0)==2&&reading_page_next(17,2)==0);
 assert(reading_page_next(4,1)==1&&reading_page_next(0,0)==0);
 assert(!reading_page_gesture(999,0,true,true,false));
 assert(reading_page_gesture(1000,0,true,true,false));
 assert(!reading_page_gesture(2000,0,false,false,false));
 assert(!reading_page_gesture(2000,0,false,true,true));
 assert(reading_page_gesture(500,0xfffffe0b,true,true,false));
 return 0;
}
