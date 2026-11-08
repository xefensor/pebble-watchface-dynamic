#pragma once
#include "activity_presentation.h"

/* Bounded copies of actually painted primary media only. They own no source,
 * live render plan, navigation receipt, timer or persistence. */
typedef struct {
  PavCard card;
  ActivityLayout layout;
  int x;
  bool valid;
} MediaPaint;
typedef struct {MediaPaint latest,outgoing;} MediaTransition;

static inline void media_paint_clear(MediaPaint *paint){memset(paint,0,sizeof(*paint));}
static inline void media_transition_clear(MediaTransition *motion){memset(motion,0,sizeof(*motion));}
static inline bool media_paint_visible(const MediaPaint *paint,uint32_t now,bool connected){
  return paint->valid&&pav_card_visible(&paint->card,now,connected)&&
      (!paint->card.support.type||pav_datum_visible(&paint->card,&paint->card.support,now,connected));
}
static inline void media_paint_capture(MediaPaint *paint,const PavCard *card,
    const ActivityLayout *layout,int x){
  if(card->presentation!=PAV_PRESENTATION_MEDIA||!layout->main.count||x>=200){media_paint_clear(paint);return;}
  paint->card=*card;paint->layout=*layout;paint->x=x;paint->valid=true;
}
static inline void media_transition_start(MediaTransition *motion,const PavCard *incoming,
    uint32_t now,bool connected){
  if(media_paint_visible(&motion->latest,now,connected))motion->outgoing=motion->latest;
  media_paint_clear(&motion->latest);
  if(!incoming||incoming->presentation!=PAV_PRESENTATION_MEDIA||
      !media_paint_visible(&motion->outgoing,now,connected)||
      strcmp(incoming->provider,motion->outgoing.card.provider))media_paint_clear(&motion->outgoing);
}
static inline int media_outgoing_x(const MediaPaint *paint,float progress){
  return paint->x-(int)((200+paint->x)*progress+.5f);
}
