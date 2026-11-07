#include <pebble.h>
static Window *window;static Layer *canvas;
static void draw(Layer *layer,GContext *ctx){
 graphics_context_set_fill_color(ctx,GColorWhite);graphics_fill_rect(ctx,layer_get_bounds(layer),0,GCornerNone);
 const char *keys[]={FONT_KEY_GOTHIC_18_BOLD,FONT_KEY_GOTHIC_24_BOLD,FONT_KEY_GOTHIC_28_BOLD,FONT_KEY_GOTHIC_24};
 graphics_context_set_text_color(ctx,GColorBlack);
 for(int i=0;i<4;i++){GFont font=fonts_get_system_font(keys[i]);GSize size=graphics_text_layout_get_content_size("ÁÉČŘŮžý",font,GRect(0,0,200,64),GTextOverflowModeFill,GTextAlignmentLeft);APP_LOG(APP_LOG_LEVEL_INFO,"font %d size %d,%d",i,size.w,size.h);graphics_draw_text(ctx,"ÁÉČŘŮžý",font,GRect(6,i*57,188,64),GTextOverflowModeFill,GTextAlignmentLeft,NULL);}
}
int main(void){window=window_create();canvas=layer_create(GRect(0,0,200,228));layer_set_update_proc(canvas,draw);layer_add_child(window_get_root_layer(window),canvas);window_stack_push(window,false);app_event_loop();layer_destroy(canvas);window_destroy(window);}
