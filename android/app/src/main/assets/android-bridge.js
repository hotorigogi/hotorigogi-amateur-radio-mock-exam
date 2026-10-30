'use strict';
// A synchronous local bridge keeps PC-compatible progress JSON and a native backup.
if(window.RadioAndroid){
 window.desktopProgress=Object.freeze({load:()=>RadioAndroid.load(),save:json=>({ok:RadioAndroid.save(json)})});
 window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('export').onclick=()=>RadioAndroid.exportProgress(JSON.stringify({version:3,...progress},null,2));
 });
}
