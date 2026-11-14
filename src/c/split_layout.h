#pragma once

/* Ink bounds use an exclusive clock bottom and the first painted reading row. */
static inline int split_boundary(int clock_bottom,int reading_top,int height) {
  int boundary=clock_bottom+(reading_top-clock_bottom+1)/2;
  if(boundary>reading_top)boundary=reading_top;
  return boundary<0?0:boundary>height?height:boundary;
}
