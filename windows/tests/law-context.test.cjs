const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const bank=require('../ui/questions.json'),changes=require('../content/law-context-changes.json'),canonical=require('../content/grade1-reviewed.json');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
test('all 1834 answer options, correct answers, grading eligibility and content revisions remain identical',()=>{
 const fields=['id','options','answer','gradable','content_revision'];assert.equal(hash(bank.map(q=>Object.fromEntries(fields.map(k=>[k,q[k]])))),changes.score_basis_sha256);
 assert.equal(hash(bank.filter(q=>!changes.question_ids.includes(q.id))),changes.unrelated_questions_sha256);
});
test('22 selected questions include concise context and a specific question in both canonical and runtime data',()=>{
 assert.equal(changes.changed_count,22);assert.equal(changes.clause_reference_questions_reviewed,208);assert.equal(new Set(changes.question_ids).size,22);
 for(const c of changes.changes){const q=bank.find(q=>q.id===c.id),source=canonical.find(q=>q.id===c.source_id);assert.equal(q.question,c.after);assert.equal(q.law_context,c.law_context);assert.ok(q.law_context.length>=35&&q.law_context.length<=150);assert.ok(q.law_reference);assert.ok(q.explanation.length>70);assert.equal(source.question,q.question);assert.equal(source.law_context,q.law_context);assert.deepEqual(source.options,q.options);assert.equal(source.answer,q.answer);}
 for(const id of [10198,10314]){const q=bank.find(q=>q.id===id);assert.match(q.law_context,/발신국/);assert.match(q.law_context,/오류/);assert.doesNotMatch(q.question,/제3조/);assert.match(q.explanation,/즉시 정정/);}
});
test('an existing answer and saved mock session containing an annotated question keep their revision and import correctly',()=>{
 const M=require('../ui/mock.js'),I=require('../ui/import.js'),S=require('../storage.cjs');const q=bank.find(q=>q.id===10314);const e=M.draw(bank);let i=e.ids.indexOf(q.id);
 if(i<0){i=20;delete e.revisions[e.ids[i]];e.ids[i]=q.id;e.revisions[q.id]=q.content_revision;}
 e.answers[q.id]=q.answer;const p={records:{[q.id]:{choice:q.answer,correct:true,graded:true,revision:q.content_revision,at:''}},marks:[q.id],last:q.id,mockExams:{'1':e}};
 assert.equal(S.normalizeProgress(JSON.stringify(p)).mockExams['1'].answers[q.id],q.answer);const got=I.parse(JSON.stringify(p),bank);assert.equal(got.records[q.id].correct,true);assert.equal(got.archived_records.length,0);assert.ok(got.mockExams['1']);
});
