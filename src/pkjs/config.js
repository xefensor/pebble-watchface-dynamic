'use strict';

// Clay retains the established preference keys. Page-only choices translate to
// these fields, so notification privacy remains compatible with earlier builds.
module.exports = [
  {type:'heading',defaultValue:'Dynamic'},
  {type:'text',id:'dynamic-intro',defaultValue:'Choose colours and what appears on your watch.'},
  {type:'section',items:[
    {type:'heading',defaultValue:'Appearance'},
    {type:'select',messageKey:'TEXT_SIZE',defaultValue:0,label:'Text size',serializeValueAs:'integer',options:[{label:'Follow Pebble',value:0},{label:'Small',value:1},{label:'Medium',value:2},{label:'Large',value:3}]},
    {type:'select',messageKey:'APPEARANCE_MODE',defaultValue:2,label:'Appearance',serializeValueAs:'integer',options:[{label:'Follow Pebble',value:0},{label:'Follow Quiet Time',value:1},{label:'Manual',value:2}]},
    {type:'select',messageKey:'MANUAL_APPEARANCE',defaultValue:0,label:'Manual palette',serializeValueAs:'integer',options:[{label:'Light',value:0},{label:'Dark',value:1}]},
    {type:'text',id:'dynamic-appearance-unavailable',defaultValue:'Follow Pebble appearance is unavailable on this build. It uses your last Light or Dark choice.'},
    {type:'text',id:'dynamic-display-status',defaultValue:'Saved on phone · Pending on watch'},
    {type:'text',id:'dynamic-preview',defaultValue:'Layout & colour preview'},
    {type:'text',id:'dynamic-theme',defaultValue:'Theme'},
    {type:'color',messageKey:'BACKGROUND_COLOR',defaultValue:'0xFFFFFF',label:'Background color',layout:'COLOR',sunlight:false},
    {type:'color',messageKey:'TEXT_COLOR',defaultValue:'0x000000',label:'Text color',layout:'COLOR',sunlight:false},
    {type:'color',messageKey:'ACCENT_COLOR',defaultValue:'0x55AAFF',label:'Accent color',description:'Color for reading symbols and rain gauges.',layout:'COLOR',sunlight:false},
    {type:'text',id:'dynamic-contrast',defaultValue:''},
    {type:'text',id:'dynamic-palette-code',defaultValue:'Share colours'},
    {type:'toggle',messageKey:'NIGHT_PALETTE',defaultValue:false,label:'Quiet Time colours',description:'Use these watch colours while Pebble Quiet Time is active.'},
    {type:'color',messageKey:'NIGHT_BACKGROUND_COLOR',defaultValue:'0x000000',label:'Night background',layout:'COLOR',sunlight:false},
    {type:'color',messageKey:'NIGHT_TEXT_COLOR',defaultValue:'0xFFFFFF',label:'Night text',layout:'COLOR',sunlight:false},
    {type:'color',messageKey:'NIGHT_ACCENT_COLOR',defaultValue:'0x55AAFF',label:'Night accent',layout:'COLOR',sunlight:false},
    {type:'select',messageKey:'CLOCK_FORMAT',defaultValue:0,label:'Time format',serializeValueAs:'integer',options:[
      {label:'Follow Pebble',value:0},{label:'12-hour time',value:12},{label:'24-hour time',value:24}
    ]},
    {type:'toggle',messageKey:'ANIMATIONS',defaultValue:true,label:'Animations',description:'Short transitions when activities change.'},
    {type:'toggle',messageKey:'SHOW_STATUS',defaultValue:true,label:'Status indicators',description:'Low watch or phone battery and lost connection.'},
    {type:'text',defaultValue:'Language follows your watch.'}
  ]},
  {type:'section',items:[
    {type:'heading',defaultValue:'Content & priority'},
    {type:'text',id:'dynamic-readings',defaultValue:'Your two readings'},
    {type:'text',id:'dynamic-reading-help',defaultValue:'Choose slots 1 and 2 in Pebble → Settings → Complications.'},
    {type:'heading',defaultValue:"What is an activity?"},
    {type:'text',defaultValue:"Activities are live updates shown by compatible XOCE apps and watchfaces, such as a countdown, music or a new notification."},
    {type:'text',defaultValue:"Start a countdown in Timer, then return to Dynamic to see the time remaining. Timer still runs the countdown and alarm."},
    {type:'text',defaultValue:"Turn on activity plugins and show Timer in the activity list below, then save. Create and control your countdowns in Timer on the watch."},
    {type:'text',defaultValue:"Sharing activities between apps needs plugin support and a connected phone. Timer works on its own without sharing."},
    {type:'toggle',messageKey:'SHOW_ACTIVITIES',defaultValue:true,label:'Show activity plugins',description:'Show activities from installed plugins. Music and Notifications have their own switches in the list below.'},
    {type:'text',id:'dynamic-activity-order',defaultValue:'Activity priority'},
    {type:'toggle',messageKey:'SHOW_MUSIC',defaultValue:true,label:'Show music while playing'},
    {type:'text',id:'dynamic-notification-mode',defaultValue:'Notification details'},
    {type:'text',id:'dynamic-notification-disabled',defaultValue:'Enable Notifications in the activity list to change its details.'},
    {type:'toggle',messageKey:'SHOW_NOTIFICATIONS',defaultValue:false,label:'New notifications'},
    {type:'toggle',messageKey:'NOTIFICATION_PREVIEW',defaultValue:false,label:'Include message text'},
    {type:'toggle',messageKey:'NOTIFICATION_APP_ONLY',defaultValue:false,label:'App name only'},
    {type:'select',messageKey:'NOTIFICATION_VIBRATION',defaultValue:0,label:'Additional vibration',description:'One additional vibration per new notification burst, using your app filter. Respects Quiet Time. Turn this off if Pebble already vibrates for those notifications.',serializeValueAs:'integer',options:[
      {label:'Off',value:0},{label:'Short pulse',value:1},{label:'Double pulse',value:2}
    ]},
    {type:'text',id:'dynamic-notification-help',defaultValue:'New notifications use the same activity priority and primary/secondary layouts. Allow notification access in Pebble. Pebble’s system notifications remain separate.'},
    {type:'text',id:'dynamic-app-mode',defaultValue:'Notification apps'},
    {type:'input',messageKey:'NOTIFICATION_APPS',defaultValue:'',label:'Selected apps',description:'Use exact app names or Android package names, separated by commas. For example: Signal, org.thoughtcrime.securesms',attributes:{type:'text',maxlength:160,autocapitalize:'none',autocomplete:'off',spellcheck:'false'}}
  ]},
  {type:'section',items:[
    {type:'heading',defaultValue:'Connection & help'},
    {type:'text',id:'dynamic-save-status',defaultValue:'Changes apply after you save.'},
    {type:'text',defaultValue:'Status when settings opened. Reopen settings to refresh.'},
    {type:'text',id:'dynamic-source-status',defaultValue:'Dynamic content: waiting for Pebble'},
    {type:'text',id:'complications-status',defaultValue:'Complications: waiting for Pebble'},
    {type:'text',id:'context-status',defaultValue:'Dynamic content: waiting for Pebble'},
    {type:'text',defaultValue:'Timeline Peek keeps the clock and complications 1 and 2. Its event panel takes priority over music and notifications.'}
  ]},
  {type:'submit',defaultValue:'Save'},
  // Transport components have no preference keys and are never submitted.
  {type:'text',id:'dynamic-settings-data',defaultValue:'{}'},
  {type:'text',id:'dynamic-settings-strings',defaultValue:'{}'},
  {type:'text',id:'dynamic-preview-assets',defaultValue:'{}'},
  {type:'input',messageKey:'__dynamicActivityPreferences',defaultValue:'',attributes:{type:'hidden'}}
];
