"""Exercise actual native callbacks with counted SDK boundaries, without QEMU."""
from pathlib import Path
import os
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def callback(source, name):
    match = re.search(r'^static [^\n]+\b' + name + r'\([^)]*\)\s*\{', source, re.M)
    if not match:
        raise AssertionError('Missing production callback ' + name)
    begin = source.index('{', match.start())
    depth = 1
    end = begin + 1
    while depth:
        depth += (source[end] == '{') - (source[end] == '}')
        end += 1
    return source[match.start():end]


class NativeLifecycleTests(unittest.TestCase):
    def test_actual_callbacks_cancel_covered_work_and_reconcile_without_replaying_motion(self):
        source = (ROOT / 'src/c/dynamic.c').read_text()
        names = ['prv_dirty', 'prv_cancel_motion', 'prv_motion_frame', 'prv_schedule_motion',
                 'prv_apply_unobstructed_layout', 'prv_sync_layers',
                 'prv_activity_clock_tick', 'prv_context_expired',
                 'prv_focus_will_change', 'prv_focus_did_change',
                 'prv_draw_context', 'prv_update_clock']
        bodies = [callback(source, name) for name in names]
        declarations = '\n'.join(body[:body.index('{')].strip() + ';' for body in bodies)
        harness = r'''
#include <assert.h>
#include <stdio.h>
#include <time.h>
#include "watch_layout.h"
#include "activity_plan_cache.h"
#define PAV_PROVIDER_BYTES 37
#define PAV_ID_BYTES 65
#define PAV_PRESENTATION_MEDIA 2
#define MOTION_FRAME_MS 33
#define FULL_LAYOUT_HEIGHT 228
typedef struct { int value; } Layer, AppTimer, GContext;
typedef struct { struct { int y; } origin; struct { int h; } size; } GRect;
#define GRect(x,y,w,h) ((GRect){{y},{h}})
typedef struct { char provider[37],id[65];int presentation;uint8_t visual_token[8]; } PavCard;
typedef struct { ActivityPlanCache cache;struct { int top;struct { int count; } main; } layout; } Plan;
typedef struct { Plan activity_plan; } Native;
static Native storage,*s_native=&storage;
static Layer background,context,window;
static Layer *s_background_layer=&background,*s_context_layer=&context,*s_window_layer=&window;
static AppTimer timers[64],*s_motion_timer,*s_activity_timer,*s_presentation_timer,*s_context_timer;
static bool s_app_focused=true,s_animations_enabled=true,s_peek_transition,s_panel_entering,s_pose_ready;
static WatchPose s_pose,s_pose_target;
static int s_panel_offset,unobstructed=228,frame_y,frame_height;
static uint32_t s_panel_started,millis,last_interval;
static PavCard card,*selected=&card;
static bool s_phone_connected=true,s_use_12_hour;
static uint8_t s_clock_format=24;
static char s_time_buffer[6],s_weekday_buffer[13],s_numeric_date_buffer[8],s_compact_date_buffer[24];
static const char english[]="en",czech[]="cs";
static const char *locale=english;
static time_t now=1700000000;
static unsigned dirty_background,dirty_context,registrations,cancellations,geometry,scheduled,prunes,draws,reports,stable_reports;
static bool fail_timer;
static time_t fake_time(time_t *out){if(out)*out=now;return now;}
#define time fake_time
static uint32_t prv_millis(void){return millis;}
static const PavCard *prv_primary_activity(void){return selected;}
static int activity_top=86;
static int prv_activity_top(void){return activity_top;}
static WatchPose prv_full_pose(void){return selected?watch_pose_context(false):watch_pose_idle();}
static WatchPose prv_current_pose(void){return watch_pose_at_height(s_pose,unobstructed);}
static GRect layer_get_unobstructed_bounds(Layer *layer){(void)layer;return GRect(0,0,200,unobstructed);}
static void layer_mark_dirty(Layer *layer){if(layer==&background)++dirty_background;else if(layer==&context)++dirty_context;}
static void layer_set_frame(Layer *layer,GRect rect){(void)layer;frame_y=rect.origin.y;frame_height=rect.size.h;++geometry;}
static void layer_set_bounds(Layer *layer,GRect rect){(void)layer;(void)rect;++geometry;}
static void layer_set_hidden(Layer *layer,bool hidden){(void)layer;(void)hidden;++geometry;}
static AppTimer *app_timer_register(uint32_t ms,void(*fn)(void *),void *ctx){last_interval=ms;(void)fn;(void)ctx;++registrations;return fail_timer?NULL:&timers[registrations%64];}
static void app_timer_cancel(AppTimer *timer){assert(timer);++cancellations;}
static void prv_activity_clock_schedule(void){++scheduled;}
static void prv_schedule_context_expiry(void){++prunes;}
static void prv_apply_colors(void){}
static int s_activities;
static void pav_state_prune(int *state,uint32_t at){(void)state;(void)at;++prunes;}
static const char *i18n_get_system_locale(void){return locale;}
static const char *reading_language(const char *language){return language;}
static bool clock_is_24h_style(void){return true;}
static const char *prv_get_localized_day(const char *language,unsigned day){(void)language;(void)day;return "MON";}
static void prv_draw_activity(GContext *ctx,const PavCard *item,int y){(void)ctx;(void)item;(void)y;++draws;}
static void prv_note_presentation(const PavCard *item,bool stable){(void)item;++reports;if(stable)++stable_reports;}
'''
        harness += declarations + '\n' + '\n'.join(bodies)
        harness += r'''
static void reset_counts(void){dirty_background=dirty_context=registrations=cancellations=geometry=scheduled=prunes=draws=reports=stable_reports=0;}
int main(void){
  strcpy(card.provider,"provider");strcpy(card.id,"first");card.presentation=PAV_PRESENTATION_MEDIA;
  s_pose_ready=true;s_pose=s_pose_target=watch_pose_context(false);
  s_panel_entering=true;s_panel_offset=10;
  s_motion_timer=&timers[0];s_activity_timer=&timers[1];s_presentation_timer=&timers[2];
  prv_focus_will_change(false);
  assert(!s_app_focused&&!s_panel_entering&&s_panel_offset==0);
  assert(!s_motion_timer&&!s_activity_timer&&!s_presentation_timer&&cancellations==3);
  reset_counts();
  prv_motion_frame(NULL);prv_activity_clock_tick(NULL);
  assert(!registrations&&!dirty_context&&!dirty_background&&!prunes);
  for(unsigned i=0;i<20;++i){++card.visual_token[0];prv_apply_unobstructed_layout();prv_dirty(&background);}
  assert(!registrations&&!dirty_context&&!dirty_background&&!geometry);
  assert(!s_panel_entering&&s_panel_offset==0);
  prv_context_expired(NULL);assert(prunes==1&&!registrations&&!dirty_context&&!dirty_background);
  s_native->activity_plan.layout.main.count=1;
  prv_draw_context(&context,NULL);
  assert(draws==1&&!reports&&!s_native->activity_plan.cache.drawn);
  /* A cover does not manufacture a navigation withdrawal or another lease. */
  now+=61;prv_focus_did_change(true);
  assert(s_app_focused&&!s_panel_entering&&s_panel_offset==0);
  assert(dirty_context&&dirty_background&&geometry&&prunes==2);
  assert(s_time_buffer[0]&&s_numeric_date_buffer[0]);
  prv_draw_context(&context,NULL);assert(reports==1&&s_native->activity_plan.cache.drawn);
  /* A static activity is not repainted just because the wall clock changes. */
  s_native->activity_plan.layout.top=activity_top;
  s_native->activity_plan.cache=(ActivityPlanCache){selected,locale,(uint32_t)now,(uint32_t)now+300,true,true,false,true};
  reset_counts();now+=60;prv_update_clock();
  assert(dirty_background==1&&!dirty_context&&!geometry);
  /* An observation becoming aged can reclaim the reading's second line.
   * Repaint that geometry once without replaying the panel entrance. */
  activity_top=106;reset_counts();prv_update_clock();
  assert(dirty_context==1&&!s_panel_entering&&!registrations);
  s_native->activity_plan.layout.top=activity_top;
  reset_counts();prv_update_clock();assert(dirty_background==1&&!dirty_context);
  activity_top=86;s_native->activity_plan.layout.top=86;reset_counts();
  /* Locale, datum expiry and a changing clock still invalidate the plan. */
  locale=czech;prv_update_clock();assert(dirty_context==1);
  s_native->activity_plan.cache.language=locale;s_native->activity_plan.cache.valid_until=(uint32_t)now;
  prv_update_clock();assert(dirty_context==2);
  s_native->activity_plan.cache.valid_until=(uint32_t)now+300;
  s_native->activity_plan.cache.ticking=true;
  prv_update_clock();assert(dirty_context==3);
  /* Existing panel updates (including media replacement) stay stationary. */
  reset_counts();prv_apply_unobstructed_layout();assert(!s_panel_entering);
  ++card.visual_token[0];strcpy(card.id,"replacement");prv_apply_unobstructed_layout();
  assert(!s_panel_entering&&!registrations);
  /* A newly appearing panel gets a short vertical settle, while header and
   * readings snap directly to the final pose. No presentation receipt yet. */
  selected=NULL;prv_apply_unobstructed_layout();assert(s_pose_target.context==0);
  selected=&card;millis=100;reset_counts();prv_apply_unobstructed_layout();
  const WatchPose active=watch_pose_context(false);
  assert(!memcmp(&s_pose,&active,sizeof(active)));
  assert(s_panel_entering&&s_panel_offset==10&&last_interval==33);
  assert(frame_y==96&&frame_y+frame_height==228);
  s_native->activity_plan.layout.main.count=1;
  prv_draw_context(&context,NULL);assert(!stable_reports&&!s_native->activity_plan.cache.drawn);
  const uint32_t started=s_panel_started;
  millis=started+66;prv_motion_frame(NULL);
  assert(s_panel_entering&&s_panel_offset==3&&frame_y==89);
  assert(!memcmp(&s_pose,&active,sizeof(active)));
  prv_apply_unobstructed_layout();assert(s_panel_started==started); /* no replay */
  millis=started+132;prv_motion_frame(NULL);
  assert(!s_panel_entering&&s_panel_offset==0&&frame_y==86&&frame_height==142);
  prv_draw_context(&context,NULL);assert(stable_reports==1&&s_native->activity_plan.cache.drawn);
  const unsigned settled=registrations,paints=dirty_context;
  prv_motion_frame(NULL);assert(registrations==settled&&dirty_context==paints);
  /* Peek uses one composition at every obscured height and cancels entry;
   * restoring the face does not replay it. */
  selected=NULL;prv_apply_unobstructed_layout();selected=&card;prv_apply_unobstructed_layout();
  assert(s_panel_entering);unobstructed=220;prv_apply_unobstructed_layout();
  assert(!s_panel_entering&&!s_motion_timer&&frame_height==0);
  prv_draw_context(&context,NULL);assert(!s_native->activity_plan.cache.drawn);
  unobstructed=228;prv_apply_unobstructed_layout();assert(!s_panel_entering);
  /* Expiry clears the panel immediately, including any in-flight entry. */
  selected=NULL;prv_apply_unobstructed_layout();selected=&card;prv_apply_unobstructed_layout();
  assert(s_panel_entering);selected=NULL;prv_context_expired(NULL);
  assert(!s_panel_entering&&!s_motion_timer&&s_pose_target.context==0&&frame_height==0);
  const unsigned previous_draws=draws;prv_draw_context(&context,NULL);
  assert(draws==previous_draws&&!s_native->activity_plan.layout.main.count);
  /* Timer allocation failures settle at the final layout, never halfway. */
  fail_timer=true;selected=&card;prv_apply_unobstructed_layout();
  assert(!s_panel_entering&&s_panel_offset==0&&!s_motion_timer);
  assert(!memcmp(&s_pose,&s_pose_target,sizeof(s_pose)));
  fail_timer=false;selected=NULL;prv_apply_unobstructed_layout();selected=&card;prv_apply_unobstructed_layout();
  assert(s_panel_entering);fail_timer=true;millis=s_panel_started+33;prv_motion_frame(NULL);
  assert(!s_panel_entering&&s_panel_offset==0&&!s_motion_timer);
  puts("covered callbacks: zero decorative registrations/dirty requests; fresh return and static-minute/expiry/locale gates passed");
  return 0;
}
'''
        with tempfile.TemporaryDirectory(prefix='dynamic-native-lifecycle-') as tmp:
            path = Path(tmp) / 'callbacks.c'
            path.write_text(harness)
            output = Path(tmp) / 'callbacks'
            subprocess.run([os.environ.get('CC', 'cc'), '-std=c99', '-Wall', '-Wextra', '-Werror',
                            '-I' + str(ROOT / 'src/c'), str(path), '-o', str(output)], check=True)
            subprocess.run([str(output)], check=True)


    def test_actual_presentation_gate_never_exports_a_yielded_secondary(self):
        source = (ROOT / 'src/c/dynamic.c').read_text()
        body = callback(source, 'prv_note_presentation')
        harness = r'''
#include <assert.h>
#include <time.h>
#include "activity_navigation.h"
typedef struct { unsigned type;uint32_t valid_until; } PavDatum;
typedef struct { uint32_t source_valid_until;PavDatum main,support; } PavCard;
typedef struct { struct { struct {int count;}main;bool secondary;}layout;const PavCard *alternate;}ActivityPlan;
typedef struct { ActivityPlan activity_plan;ActivityNavigation navigation;}Native;
typedef struct {int unused;}AppTimer;
static Native store,*s_native=&store;
static struct {struct {PavCard items[2];uint32_t view_sequence;}snapshot;}s_activities;
static struct {uint32_t token;}s_session={7};
static AppTimer timer,*s_presentation_timer;
static uint8_t sent[ACTIVITY_NAV_BYTES];
static unsigned sends;
static const PavDatum *activity_compact_datum(const PavCard *card){return &card->main;}
static void app_timer_cancel(AppTimer *value){assert(value==&timer);}
static void prv_presentation_refresh(void *context){(void)context;}
static AppTimer *app_timer_register(unsigned delay,void(*callback)(void *),void *context){
 assert(delay==30000&&callback==prv_presentation_refresh&&!context);return &timer;
}
static void prv_send_presentation(void){++sends;activity_navigation_encode(&store.navigation,sent);}
''' + body + r'''
int main(void){
 const uint32_t now=(uint32_t)time(NULL);
 s_activities.snapshot.view_sequence=11;
 s_activities.snapshot.items[0]=(PavCard){.source_valid_until=now+120,.main={1,now+90}};
 s_activities.snapshot.items[1]=(PavCard){.source_valid_until=now+60,.main={1,now+30}};
 store.activity_plan.layout.main.count=1;
 store.activity_plan.alternate=&s_activities.snapshot.items[1];
 /* A fitted-out row can still have its candidate pointer; it must remain absent
  * from both the actual receipt and the Open Activity navigation wire. */
 store.activity_plan.layout.secondary=false;
 prv_note_presentation(&s_activities.snapshot.items[0],true);
 assert(sends==1&&sent[1]==0&&sent[2]==ACTIVITY_NAV_ABSENT);
 assert(store.navigation.expires_at==now+90);
 store.activity_plan.layout.secondary=true;
 prv_note_presentation(&s_activities.snapshot.items[0],true);
 assert(sends==2&&sent[1]==0&&sent[2]==1&&store.navigation.expires_at==now+30);
 store.activity_plan.layout.secondary=false;
 prv_note_presentation(&s_activities.snapshot.items[0],true);
 assert(sends==3&&sent[2]==ACTIVITY_NAV_ABSENT&&store.navigation.expires_at==now+90);
 prv_note_presentation(&s_activities.snapshot.items[0],false);
 assert(sends==4&&sent[1]==ACTIVITY_NAV_ABSENT&&sent[2]==ACTIVITY_NAV_ABSENT);
 assert(!s_presentation_timer);
 return 0;
}
'''
        with tempfile.TemporaryDirectory(prefix='dynamic-presentation-fit-') as tmp:
            path = Path(tmp) / 'presentation.c'
            path.write_text(harness)
            output = Path(tmp) / 'presentation'
            subprocess.run([os.environ.get('CC', 'cc'), '-std=c99', '-Wall', '-Wextra', '-Werror',
                            '-I' + str(ROOT / 'src/c'), str(path), '-o', str(output)], check=True)
            subprocess.run([str(output)], check=True)


if __name__ == '__main__':
    unittest.main()
