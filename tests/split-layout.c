#include <assert.h>
#include "../src/c/split_layout.h"

int main(void) {
  /* Whichever layout/font produced these bounds, both clear gaps differ by
   * at most one native row. No fixed offset can provide this for all gaps. */
  for(int clock=0;clock<228;++clock)for(int reading=clock;reading<=228;++reading){
    const int boundary=split_boundary(clock,reading,228);
    const int upper=boundary-clock,lower=reading-boundary;
    assert(upper>=0&&lower>=0&&upper-lower>=-1&&upper-lower<=1);
  }
  assert(split_boundary(112,146,228)==129);
  assert(split_boundary(85,104,260)==95);
  assert(split_boundary(110,160,260)==135);
  assert(split_boundary(95,94,228)==94);
  assert(split_boundary(-20,-10,228)==0);
  assert(split_boundary(280,300,260)==260);
  return 0;
}
