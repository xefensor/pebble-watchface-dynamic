#pragma once

#include "watch_layout.h"

/* Dynamic keeps its own Roboto/Fredoka hierarchy. Medium is the established
 * composition; only supporting text responds to these three effective sizes. */
typedef struct { int date,body,secondary,unit_delta; } DynamicType;
static inline DynamicType dynamic_type(unsigned size) {
  const DynamicType profiles[]={{22,22,20,-2},{26,24,22,0},{28,28,26,4}};
  return profiles[size>2?2:size];
}
static inline int dynamic_unit_point(DynamicType type,int number_point) {
  return (number_point>32?20:14)+type.unit_delta;
}
/* The clock fields stay unchanged. A larger second line gets measured leading
 * and moves the reading group up only when the actual OS overlay requires it. */
static inline WatchPose dynamic_reading_pose(WatchPose pose,int height,
    int first_height,int second_ascent,int second_descent,bool second_line) {
  if(second_line) {
    const int leading=(first_height+1)/2+second_ascent+3;
    if(pose.label_y<leading)pose.label_y=leading;
    const float last=height-2-pose.label_y-second_descent;
    if(pose.row_y>last)pose.row_y=last;
  }
  return pose;
}
