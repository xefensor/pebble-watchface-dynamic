#include <assert.h>
#include "../src/c/activity_presentation.h"
#include "../src/c/supporting_type.h"
#include "../src/c/generated_body_metrics.h"

static MusicTextMetrics measure(void *context,const char *text,int point) {
  (void)context;const unsigned char *at=(const unsigned char *)text;int width=0;
  while(*at){body_metric_next_codepoint(&at);width+=4;}
  return (MusicTextMetrics){width,body_text_ascent(text,point),body_text_descent(text,point)};
}
static ActivityLayout build(const char *artist,unsigned size,bool secondary,bool image,int top) {
  const DynamicType type=dynamic_type(size);ActivityLayout out;
  activity_layout_build_type("A long title with accents Čgj and many words","","",artist,
      true,false,false,secondary,image,false,true,dynamic_music_artist_point(type),type.secondary,
      top,measure,measure,NULL,&out,type.body,type.secondary,30);
  assert(out.main.count&&out.point==type.body&&out.footer_point==dynamic_music_artist_point(type));
  assert(out.icon_size==40&&out.icon_top==176&&out.footer_left==58&&out.footer_width==132);
  assert(out.footer.count<=2);
  int footer_top=out.icon_top;
  for(int i=0;i<out.footer.count;++i) {
    const MusicTextMetrics ink=measure(NULL,out.footer.text[i],out.footer_point);
    assert(ink.width<=132);
    const int top=out.footer_baseline[i]-ink.ascent;
    if(top<footer_top)footer_top=top;
    if(i)assert(top>=out.footer_baseline[i-1]+
        measure(NULL,out.footer.text[i-1],out.footer_point).descent+3);
  }
  if(out.footer.count) {
    const int last=out.footer.count-1;
    assert(out.footer_baseline[last]+measure(NULL,out.footer.text[last],out.footer_point).descent==216);
  }
  const int last=out.main.count-1;
  assert(out.main_baseline[last]+measure(NULL,out.main.text[last],out.point).descent==footer_top-8);
  return out;
}
int main(void) {
  const char *artists[]={"","Fleetwood Mac","Justice, Tame Impala",
    "Žluťoučký kůň, Die Ärzte und die unglaublich langen Künstlernamen",
    "Paused · An artist with an extremely long unbroken name aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"};
  for(unsigned size=0;size<3;++size)for(unsigned secondary=0;secondary<2;++secondary)
    for(unsigned top=86;top<=106;top+=20)for(unsigned i=0;i<sizeof(artists)/sizeof(*artists);++i) {
      const ActivityLayout pending=build(artists[i],size,secondary,false,top);
      const ActivityLayout loaded=build(artists[i],size,secondary,true,top);
      assert(!memcmp(&pending,&loaded,sizeof(pending)));
      if(i==4)assert(!strncmp(pending.footer.text[0],"Paused",6));
    }
  char boundary[80];memset(boundary,'M',32);boundary[32]=0;
  ActivityLayout below=build(boundary,1,false,false,86);
  assert(below.footer.count==1&&below.footer.complete);
  boundary[32]='M';boundary[33]=0;
  ActivityLayout exact=build(boundary,1,false,false,86);
  assert(exact.footer.count==1&&exact.footer.complete);
  boundary[33]='M';boundary[34]=0;
  ActivityLayout above=build(boundary,1,false,false,86);
  assert(above.footer.count==2&&above.footer.complete);
  memset(boundary,'M',79);boundary[79]=0;
  ActivityLayout overflow=build(boundary,1,false,false,86);
  assert(overflow.footer.count==2&&!overflow.footer.complete);
  assert(strstr(overflow.footer.text[1],"…"));
  // A tall two-line artist yields the optional row before hiding the song.
  ActivityLayout required=build("Žluťoučký kůň Žluťoučký kůň Žluťoučký kůň",2,true,false,106);
  assert(!required.secondary&&required.main.count&&required.footer.count==2);
  return 0;
}
