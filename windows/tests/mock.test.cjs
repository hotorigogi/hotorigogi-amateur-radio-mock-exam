const test=require('node:test'),assert=require('node:assert/strict');
const bank=require('../ui/questions.json'),M=require('../ui/mock.js');
const {normalizeProgress,createStore}=require('../storage.cjs');
const {parse}=require('../ui/import.js');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
function answered(counts){const e=M.draw(bank,Math.random,1000);let offset=0;M.SUBJECTS.forEach(([s,n],i)=>{for(const id of e.ids.slice(offset,offset+n)){const q=bank.find(q=>q.id===id);e.answers[id]=e.ids.indexOf(id)-offset<counts[i]?q.answer:q.answer%4+1;}offset+=n;});return e;}
test('90 unique grade1 questions use exact subject quotas and randomize on new exams',()=>{
 const a=M.draw(bank),b=M.draw(bank);assert.equal(a.ids.length,90);assert.equal(new Set(a.ids).size,90);assert.notDeepEqual(a.ids,b.ids);
 for(const [s,n] of M.SUBJECTS)assert.equal(a.ids.filter(id=>bank.find(q=>q.id===id).subject===s).length,n);
 assert.ok(a.ids.every(id=>bank.find(q=>q.id===id).grade==='1'));assert.equal(a.deadline-a.startedAt,5400000);
 assert.throws(()=>M.draw(bank.filter(q=>q.subject!=='영어')),/부족/);
});
test('40 and 60 boundaries; all 90 questions count and subject mean is unweighted',()=>{
 const boundary=M.score(answered([8,6,12,14,20]),bank); // 40,60,60,70,100 =66
 assert.equal(boundary.passed,true);assert.equal(boundary.parts[0].score,40);
 assert.equal(M.score(answered([12,6,12,12,12]),bank).average,60);
 assert.equal(M.score(answered([12,6,12,12,12]),bank).passed,true);
 assert.equal(M.score(answered([12,5,12,12,12]),bank).passed,false);
 assert.equal(M.score(answered([7,10,20,20,20]),bank).passed,false);
 const empty=M.score(M.draw(bank),bank);assert.equal(empty.unanswered,90);assert.equal(empty.correct,0);assert.equal(empty.passed,false);assert.ok(empty.parts.every(p=>p.wrong===p.total));
});
test('exam draft/result survives disk reload, export import and leaves practice records intact',()=>{
 const e=answered([12,6,12,12,12]);e.index=23;delete e.answers[e.ids[88]];
 const p={records:{},marks:[1],last:1,mockExam:e};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radio-mock-'));
 try{const s=createStore(dir);s.write(JSON.stringify(p));const got=JSON.parse(createStore(dir).read());assert.deepEqual(got.mockExams['1'],e);assert.deepEqual(parse(JSON.stringify(got),bank).mockExams['1'],e);assert.deepEqual(got.records,{});
 e.submittedAt=2000;assert.deepEqual(normalizeProgress(JSON.stringify(p)).mockExams['1'],e);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('stale, duplicate, out of subject and malformed saved exams are discarded',()=>{
 const e=M.draw(bank);assert.ok(M.normalize(e,bank));
 const mutate=f=>{const v=structuredClone(e);f(v);assert.equal(M.normalize(v,bank),null);};
 mutate(v=>v.ids[0]=v.ids[1]);mutate(v=>v.ids.reverse());mutate(v=>v.revisions[v.ids[0]]='old');mutate(v=>v.answers[v.ids[0]]=5);mutate(v=>v.deadline++);mutate(v=>v.submittedAt=v.deadline+1);
});
test('grade3 phone exam uses 20 law, 10 shared security, 20 equipment and 50 minutes',()=>{
 const e=M.draw(bank,Math.random,1000,'3-phone');assert.equal(e.ids.length,50);assert.equal(new Set(e.ids).size,50);assert.equal(e.deadline-e.startedAt,3000000);assert.deepEqual(M.normalize(e,bank),e);
 const known=new Map(bank.map(q=>[q.id,q]));let offset=0;
 for(const [subject,n] of M.config('3-phone').subjects){const rows=e.ids.slice(offset,offset+n).map(id=>known.get(id));assert.ok(rows.every(q=>q.subject===subject));assert.ok(rows.every(q=>q.grade===(subject==='통신보안'?'1':'3')));offset+=n;}
 assert.equal(M.practiceBank(bank,'3').length,575);assert.equal(M.practiceBank(bank,'1').length,1439);
 function fill(counts){e.answers={};let offset=0;M.config('3-phone').subjects.forEach(([s,n],i)=>{e.ids.slice(offset,offset+n).forEach((id,j)=>{e.answers[id]=j<counts[i]?known.get(id).answer:known.get(id).answer%4+1;});offset+=n;});return M.score(e,bank);}
 assert.equal(fill([8,6,16]).average,60);assert.equal(fill([8,6,16]).passed,true);assert.equal(fill([7,10,20]).passed,false);assert.equal(fill([8,5,16]).passed,false);
 e.answers={};assert.equal(M.score(e,bank).unanswered,50);assert.equal(M.score(e,bank).passed,false);
});
test('old v1 exam migrates; both grade sessions survive disk normalization and import independently',()=>{
 const old=M.draw(bank,Math.random,1000);old.version=1;delete old.type;
 const p={records:{},marks:[],last:1,mockExam:old};const migrated=normalizeProgress(JSON.stringify(p));assert.equal(migrated.mockExams['1'].version,2);assert.equal(migrated.mockExams['1'].type,'1');assert.deepEqual(migrated.mockExams['1'].ids,old.ids);
 const phone=M.draw(bank,Math.random,1000,'3-phone');phone.answers[phone.ids[0]]=2;migrated.mockExams['3-phone']=phone;
 const got=normalizeProgress(JSON.stringify(migrated));assert.deepEqual(got.mockExams['3-phone'],phone);assert.deepEqual(got.mockExams['1'].ids,old.ids);assert.deepEqual(parse(JSON.stringify(got),bank).mockExams,got.mockExams);
 const bad=structuredClone(got);bad.mockExams['3-phone']=got.mockExams['1'];assert.equal(normalizeProgress(JSON.stringify(bad)).mockExams['3-phone'],undefined);
});
