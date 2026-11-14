#pragma once
#include "reading_pages.h"
/* The selected pair is always first, including across activity/Peek changes. */
static inline unsigned reading_grid_next_page(uint8_t slots,unsigned page){
  const unsigned next=reading_page_next(slots,page);
  return next==page?(page+1)%3:next;
}
static inline unsigned reading_grid_slot(uint8_t slots,unsigned page,unsigned home){
  return reading_page_slot(home<2?page:reading_grid_next_page(slots,page),home%2);
}
static inline int reading_grid_secondary(int secondary){return secondary<=20?16:secondary<=22?20:22;}
static inline int reading_grid_row(int secondary,unsigned row){return row?190:190-secondary-30;}
