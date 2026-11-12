#include <assert.h>
#include "../src/c/supporting_type.h"
#include "../src/c/activity_presentation.h"
#include "../src/c/generated_body_metrics.h"

static MusicTextMetrics measure(void *context,const char *text,int point) {
  (void)context;const unsigned char *at=(const unsigned char *)text;int width=0;
  while(*at){body_metric_next_codepoint(&at);width+=point/2;}
  return (MusicTextMetrics){width,body_text_ascent(text,point),body_text_descent(text,point)};
}
static MusicTextMetrics clock_measure(void *context,const char *text,int point) {
  (void)context;return (MusicTextMetrics){(int)strlen(text)*point/2,point*3/4,0};
}
int main(void) {
  const char *values[]={"Quick brown fox with a long notification", "Český název", "Paused", "5:12 /km"};
  for(unsigned size=0;size<3;++size) {
    const DynamicType type=dynamic_type(size);
    assert((type.date==(int[]){22,26,28}[size]));
    assert((type.body==(int[]){22,24,28}[size]));
    assert((type.secondary==(int[]){20,22,26}[size]));
    assert((dynamic_music_artist_point(type)==(int[]){16,20,22}[size]));
    assert(body_text_ascent("Čgj",type.date)>0&&body_text_ascent("Čgj",type.body)>0);
    for(unsigned i=0;i<sizeof(values)/sizeof(*values);++i) {
      ActivityLayout layout;
      const MusicTextMetrics secondary=measure(NULL,"Český název",type.secondary);
      const int secondary_height=secondary.ascent+secondary.descent+4>26?secondary.ascent+secondary.descent+4:26;
      activity_layout_build_type(values[i],"","","Artist",true,false,false,true,true,false,true,
          dynamic_music_artist_point(type),type.secondary,106,measure,measure,NULL,&layout,type.body,type.secondary,secondary_height);
      assert(layout.main.count&&layout.point==type.body&&layout.secondary_height==secondary_height);
      assert(layout.footer_point==dynamic_music_artist_point(type)&&layout.icon_size==40);
      int bottom=106+(layout.secondary?secondary_height+6:4);
      for(int line=0;line<layout.main.count;++line) {
        const MusicTextMetrics ink=measure(NULL,layout.main.text[line],layout.point);
        assert(layout.main_baseline[line]-ink.ascent>=bottom&&ink.width<=180);
        bottom=layout.main_baseline[line]+ink.descent;
      }
      for(int line=0;line<layout.footer.count;++line) {
        const MusicTextMetrics ink=measure(NULL,layout.footer.text[line],layout.footer_point);
        assert(layout.footer_baseline[line]-ink.ascent>=bottom);
        assert(layout.footer_baseline[line]+ink.descent<=216);
      }
    }
    const int ascent=body_text_ascent("Čgj",type.secondary),descent=body_text_descent("Čgj",type.secondary);
    for(int height=171;height<=228;++height) {
      const WatchPose original=watch_pose_at_height(watch_pose_idle(),height);
      const WatchPose fitted=dynamic_reading_pose(original,height,28,ascent,descent,true);
      assert(fitted.clock_x==original.clock_x&&fitted.clock_y==original.clock_y&&fitted.clock_size==original.clock_size);
      assert(fitted.date_x==original.date_x&&fitted.date_y==original.date_y);
      assert(fitted.row_y+fitted.label_y+descent<=height-2);
      assert(fitted.label_y>=14+ascent+3);
    }
  }
  ActivityLayout required;
  activity_layout_build_type("02:31","","","Paused\n1111111111111 km",false,true,false,
      true,false,false,false,26,26,106,measure,clock_measure,NULL,&required,28,26,30);
  assert(required.main.count==1&&!required.secondary&&required.footer.complete);
  assert(required.footer.count==3&&!strcmp(required.footer.text[0],"Paused"));
  assert(!strcmp(required.footer.text[1],"1111111111111")&&!strcmp(required.footer.text[2],"km"));
  return 0;
}
