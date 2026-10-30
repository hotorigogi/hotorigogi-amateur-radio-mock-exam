'use strict';
const {app,BrowserWindow,Menu,protocol,net,session,ipcMain,shell,dialog}=require('electron');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const {createStore}=require('./storage.cjs');
app.setName('RadioStudy');
protocol.registerSchemesAsPrivileged([{scheme:'radiostudy',privileges:{standard:true,secure:true,supportFetchAPI:true}}]);
const appURL='radiostudy://app/index.html';
const isAppURL=url=>{try{const u=new URL(url);return u.protocol==='radiostudy:'&&u.host==='app'}catch{return false}};
function openExternal(url){try{const u=new URL(url);if(['https:','http:'].includes(u.protocol))shell.openExternal(url).catch(()=>{});}catch{}}
if(!app.requestSingleInstanceLock()){app.quit();}else{
 let window;
 app.on('second-instance',()=>{if(window){if(window.isMinimized())window.restore();window.focus();}});
 app.whenReady().then(()=>{
  const root=path.join(__dirname,'ui');
  const files=new Map();
  function list(dir,prefix=''){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const key=prefix+entry.name;if(entry.isDirectory())list(path.join(dir,entry.name),key+'/');else files.set('/'+key,path.join(dir,entry.name));}}
  list(root);
  protocol.handle('radiostudy',req=>{const u=new URL(req.url);if(u.host!=='app'||req.method!=='GET')return new Response('Not found',{status:404});const target=files.get(u.pathname==='/'?'/index.html':u.pathname);return target?net.fetch(pathToFileURL(target).toString()):new Response('Not found',{status:404});});
  session.defaultSession.setPermissionRequestHandler((_w,_p,callback)=>callback(false));
  session.defaultSession.setPermissionCheckHandler(()=>false);
  const store=createStore(app.getPath('userData'));
  ipcMain.on('progress:load',event=>{event.returnValue=isAppURL(event.senderFrame?.url)?store.read():null;});
  ipcMain.on('progress:save',(event,json)=>{if(!isAppURL(event.senderFrame?.url)){event.returnValue={ok:false};return;}try{store.write(json);event.returnValue={ok:true};}catch(error){event.returnValue={ok:false,message:error.message};}});
  window=new BrowserWindow({width:1220,height:900,minWidth:760,minHeight:600,show:false,title:'아마추어무선기사 연습프로그램',backgroundColor:'#f5f6f1',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  window.webContents.setWindowOpenHandler(({url})=>{openExternal(url);return {action:'deny'};});
  window.webContents.on('will-navigate',(event,url)=>{if(!isAppURL(url)){event.preventDefault();openExternal(url);}});
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  window.once('ready-to-show',()=>window.show());
  window.webContents.on('render-process-gone',()=>dialog.showErrorBox('전파 연습실','화면이 종료되었어요. 앱을 다시 실행해 주세요. 저장된 기록은 유지돼요.'));
  Menu.setApplicationMenu(Menu.buildFromTemplate([
   {label:'파일',submenu:[{label:'종료',role:'quit'}]},
   {label:'화면',submenu:[{label:'새로고침',role:'reload'},{type:'separator'},{label:'확대',role:'zoomIn'},{label:'축소',role:'zoomOut'},{label:'기본 크기',role:'resetZoom'},{type:'separator'},{label:'전체 화면',role:'togglefullscreen'}]}
  ]));
  window.loadURL(appURL);
 }).catch(error=>{dialog.showErrorBox('시작할 수 없어요',error.message);app.quit();});
 app.on('window-all-closed',()=>app.quit());
}
