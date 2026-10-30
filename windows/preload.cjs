'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktopProgress',Object.freeze({
 load:()=>ipcRenderer.sendSync('progress:load'),
 save:json=>ipcRenderer.sendSync('progress:save',json)
}));
