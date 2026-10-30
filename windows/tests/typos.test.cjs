'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');
const before=JSON.parse(fs.readFileSync(path.join(root,'content/questions-before-typos.json')));
const after=JSON.parse(fs.readFileSync(path.join(root,'ui/questions.json'))).filter(q=>q.grade==='3').map(({grade,collection,display_number,source_id,...q})=>q);
const record=JSON.parse(fs.readFileSync(path.join(root,'content/typo-corrections.json')));
test('only the approved75 wording corrections were applied',()=>{
 const expected=structuredClone(before);
 for(const x of record.items){const q=expected[x.id-1];if(typeof x.field==='number')q.options[x.field]=q.options[x.field].replaceAll(x.before,x.after);else {const old=q[x.field];q[x.field]=old.replaceAll(x.before,x.after);if(x.field==='explanation'&&q.note===old)q.note=q[x.field];}}
 assert.deepEqual(after,expected);assert.equal(record.items.length,75);assert.equal(new Set(record.items.map(x=>x.id)).size,58);
});
test('all395 answers, score revisions and original source texts are preserved',()=>{
 assert.equal(after.length,395);
 for(let i=0;i<395;i++){for(const key of ['id','answer','content_revision','original_question','original_options','gradable','extraction_review'])assert.deepEqual(after[i][key],before[i][key]);assert.equal(new Set(after[i].options).size,4);}
});
test('all six withheld phrases remain unchanged',()=>{
 assert.equal(record.held.length,6);for(const h of record.held){const q=after[h.id-1];assert.ok([q.question,...q.options].some(s=>s.includes(h.text)));}
});
