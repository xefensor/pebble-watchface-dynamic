#include <assert.h>
#include "../src/c/reading_grid.h"
int main(void){
 for(unsigned mask=0;mask<32;++mask)for(unsigned page=0;page<3;++page){
  assert(reading_grid_slot(mask,page,0)==page*2);
  assert(reading_grid_slot(mask,page,1)==page*2+1);
  unsigned next=reading_grid_next_page(mask,page);
  assert(next!=page&&next<3);
  assert(reading_grid_slot(mask,page,2)==next*2);
  assert(reading_grid_slot(mask,page,3)==next*2+1);
 }
 /* A single selected pair must not repeat in both rows. Empty homes stay put. */
 assert(reading_grid_slot(3,0,2)==2);
 assert(reading_grid_slot(16,2,2)==0);
 assert(reading_grid_slot(31,0,2)==2);
 assert(reading_grid_slot(31,1,2)==4);
 assert(reading_grid_slot(31,2,2)==0);
 for(int secondary=20;secondary<=26;secondary+=2){
  int compact=reading_grid_secondary(secondary);
  assert(compact<=22);
  assert(reading_grid_row(compact,0)>130);
  assert(reading_grid_row(compact,1)-reading_grid_row(compact,0)>=46);
 }
 return 0;
}
