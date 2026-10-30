'use strict';
const fs=require('node:fs');
const path=require('node:path');
const MAX_BYTES=2*1024*1024;
const BANK=JSON.parse(fs.readFileSync(path.join(__dirname,'ui/questions.json'),'utf8'));
const KNOWN_IDS=new Set(BANK.map(q=>q.id));
const RadioMock=require('./ui/mock.js');
const validId=x=>Number.isInteger(x)&&KNOWN_IDS.has(x);
function normalizeProgress(raw){
 if(typeof raw!=='string'||Buffer.byteLength(raw)>MAX_BYTES)throw Error('기록 파일은 2MB 이하의 JSON이어야 해요.');
 const p=JSON.parse(raw);
 if(!p||typeof p!=='object'||!p.records||typeof p.records!=='object'||Array.isArray(p.records)||!Array.isArray(p.marks))throw Error('전파 연습실의 기록 파일이 아니에요.');
 const records={};
 for(const [key,r] of Object.entries(p.records)){
  if(!validId(Number(key))||!r||!Number.isInteger(r.choice)||r.choice<1||r.choice>4||typeof r.graded!=='boolean'||typeof r.correct!=='boolean')throw Error('유효하지 않은 답안이 포함돼 있어요.');
  records[Number(key)]={choice:r.choice,graded:r.graded,correct:r.correct,revision:typeof r.revision==='string'?r.revision:'v2',at:typeof r.at==='string'?r.at:''};
 }
 const marks=[...new Set(p.marks.filter(validId))];
 const result={records,marks,last:validId(p.last)?p.last:1};
 if(Array.isArray(p.archived_records))result.archived_records=p.archived_records.slice(-5000);
 const mocks=RadioMock.sessions(p,BANK);if(Object.keys(mocks).length)result.mockExams=mocks;
 return result;
}
function createStore(directory){
 const file=path.join(directory,'progress.json'),backup=file+'.bak';
 return {
  read(){for(const candidate of [file,backup]){try{return JSON.stringify(normalizeProgress(fs.readFileSync(candidate,'utf8')))}catch{}}return null;},
  write(raw){const clean=JSON.stringify(normalizeProgress(raw),null,2);fs.mkdirSync(directory,{recursive:true});const temp=file+'.tmp';if(fs.existsSync(file))fs.copyFileSync(file,backup);fs.writeFileSync(temp,clean,{mode:0o600});fs.renameSync(temp,file);return true;},
  file
 };
}
module.exports={normalizeProgress,createStore};
