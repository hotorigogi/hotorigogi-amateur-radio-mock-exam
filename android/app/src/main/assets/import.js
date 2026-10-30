'use strict';
(function(root){
function parse(text,bank){
 const p=JSON.parse(text),known=new Map(bank.map(q=>[q.id,q]));
 if(!p||!p.records||typeof p.records!=='object'||Array.isArray(p.records)||!Array.isArray(p.marks))throw Error('전파 연습실의 기록 JSON 파일을 선택해 주세요.');
 const result={records:{},marks:[...new Set(p.marks.filter(id=>known.has(id)))],last:known.has(p.last)?p.last:1,archived_records:Array.isArray(p.archived_records)?p.archived_records.slice(-5000):[]};
 for(const [id,r] of Object.entries(p.records)){
  const q=known.get(Number(id));
  if(!q||!r||!Number.isInteger(r.choice)||r.choice<1||r.choice>4)throw Error('잘못된 답안이 포함되어 있어요.');
  const clean={choice:r.choice,graded:!!q.gradable,correct:r.choice===q.answer,revision:r.revision||'v2',at:typeof r.at==='string'?r.at:''};
  if(clean.revision!==q.content_revision)result.archived_records.push({id:q.id,...clean});
  else result.records[q.id]=clean;
 }
 const engine=typeof module!=='undefined'?require('./mock.js'):root.RadioMock;
 const mocks=engine.sessions(p,bank);if(Object.keys(mocks).length)result.mockExams=mocks;
 return result;
}
root.RadioImport={parse};if(typeof module!=='undefined')module.exports={parse};
})(typeof window!=='undefined'?window:globalThis);
