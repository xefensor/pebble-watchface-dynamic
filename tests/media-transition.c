#include <assert.h>
#include "../src/c/media_transition.h"

static PavCard card(void){
  PavCard c={0};strcpy(c.provider,"music-provider");strcpy(c.id,"player");
  c.presentation=PAV_PRESENTATION_MEDIA;c.flags=PAV_PRIVATE;c.source_state=PAV_ACTIVE;
  c.source_observed_at=10;c.source_valid_until=100;
  c.main=(PavDatum){.observed_at=10,.valid_until=100,.type=PAV_TEXT,.text_length=3};
  strcpy(c.strings,"Old");return c;
}
int main(void){
  PavCard old=card(),next=card();next.visual_token[0]=1;
  ActivityLayout layout={.media=true,.main={.count=1},.footer={.count=1}};
  strcpy(layout.main.text[0],"Old title");strcpy(layout.footer.text[0],"Old artist");
  MediaTransition t={0};media_paint_capture(&t.latest,&old,&layout,0);
  old.strings[0]='X';layout.main.text[0][0]='X';
  media_transition_start(&t,&next,11,true);
  assert(t.outgoing.valid&&!t.latest.valid);
  assert(!strcmp(t.outgoing.card.strings,"Old")&&!strcmp(t.outgoing.layout.main.text[0],"Old title"));
  assert(media_outgoing_x(&t.outgoing,0)==0&&media_outgoing_x(&t.outgoing,.5f)==-100&&media_outgoing_x(&t.outgoing,1)==-200);
  int previous=0;
  for(int i=0;i<=100;++i){int x=media_outgoing_x(&t.outgoing,i/100.f);assert(x<=previous&&x>=-200);previous=x;}
  // A rapid replacement leaves from the actually painted incoming position.
  media_paint_capture(&t.latest,&next,&layout,80);next.visual_token[0]=2;
  media_transition_start(&t,&next,12,true);assert(t.outgoing.valid&&t.outgoing.card.visual_token[0]==1);
  assert(media_outgoing_x(&t.outgoing,0)==80&&media_outgoing_x(&t.outgoing,1)==-200);
  media_paint_capture(&t.latest,&next,&layout,200);assert(!t.latest.valid);
  media_transition_start(&t,&next,13,true);assert(t.outgoing.valid);
  // Expiry, disconnect, provider withdrawal and non-media promotion never retain old private ink.
  assert(!media_paint_visible(&t.outgoing,100,true)&&!media_paint_visible(&t.outgoing,13,false));
  strcpy(next.provider,"other");media_transition_start(&t,&next,13,true);assert(!t.outgoing.valid);
  old=card();old.support=(PavDatum){.type=PAV_TEXT,.observed_at=10,.valid_until=12};
  media_paint_capture(&t.latest,&old,&layout,0);assert(!media_paint_visible(&t.latest,12,true));
  old=card();media_paint_capture(&t.latest,&old,&layout,0);next=card();next.presentation=PAV_PRESENTATION_TEXT;
  media_transition_start(&t,&next,11,true);assert(!t.outgoing.valid);
  media_transition_clear(&t);MediaTransition empty={0};assert(!memcmp(&t,&empty,sizeof(t)));
  return 0;
}
