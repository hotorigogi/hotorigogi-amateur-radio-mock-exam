'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const {normalizeProgress,createStore}=require('../storage.cjs');
const {parse}=require('../ui/import.js');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'../ui/questions.json')));
function progress(){return {records:{197:{choice:4,graded:true,correct:true,revision:bank[196].content_revision,at:'2026-10-29'}},marks:[22,197],last:197};}
test('all1834 questions and explanations are packaged',()=>{assert.equal(bank.length,1834);for(const q of bank){assert.ok(q.explanation.length>0);assert.equal(q.options.length,4);assert.ok(q.answer>=1&&q.answer<=4);if(q.image)assert.ok(fs.existsSync(path.join(__dirname,'../ui',q.image)));}});
test('disk persistence survives a new store instance and recovers backup',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radio-study-test-'));try{const store=createStore(dir),p=progress();store.write(JSON.stringify(p));assert.deepEqual(JSON.parse(createStore(dir).read()),p);p.records[197].correct=false;store.write(JSON.stringify(p));fs.writeFileSync(store.file,'corrupted');assert.equal(JSON.parse(createStore(dir).read()).records[197].correct,true);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('rejects invalid/oversized disk writes without damaging existing records',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radio-study-test-'));try{const s=createStore(dir);s.write(JSON.stringify(progress()));const before=fs.readFileSync(s.file,'utf8');assert.throws(()=>s.write('{"records":{"999":{}},"marks":[]}'));assert.throws(()=>normalizeProgress(' '.repeat(2*1024*1024+1)));assert.equal(fs.readFileSync(s.file,'utf8'),before);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
test('web record import recalculates scores and archives changed questions',()=>{const p=progress();p.records[197].correct=false;p.records[41]={choice:3,graded:true,correct:true,revision:'v2'};const result=parse(JSON.stringify(p),bank);assert.equal(result.records[197].correct,true);assert.equal(result.records[41],undefined);assert.equal(result.archived_records[0].id,41);assert.deepEqual(result.marks,[22,197]);});
test('malformed record import rejected',()=>{assert.throws(()=>parse('{}',bank));const p=progress();p.records[197].choice=7;assert.throws(()=>parse(JSON.stringify(p),bank));});
