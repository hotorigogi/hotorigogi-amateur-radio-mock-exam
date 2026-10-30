'use strict';
(function(root){
function calculate(bank,records){
 const parts=[...new Set(bank.map(q=>q.subject))].map(subject=>{
  const questions=bank.filter(q=>q.subject===subject);
  const graded=questions.map(q=>records[q.id]).filter(r=>r&&r.graded);
  const done=graded.length,correct=graded.filter(r=>r.correct).length,wrong=done-correct;
  return {subject,total:questions.length,done,correct,wrong,score:done?correct/done*100:null,errorRate:done?wrong/done*100:null};
 });
 const ready=parts.length>0&&parts.every(p=>p.done>0),average=ready?parts.reduce((s,p)=>s+p.score,0)/parts.length:null;
 const failedParts=parts.filter(p=>p.done&&p.score<40).map(p=>p.subject);
 const done=parts.reduce((s,p)=>s+p.done,0);
 return {parts,average,failedParts,done,complete:bank.length>0&&done===bank.length,status:!ready?'waiting':failedParts.length||average<60?'fail':'pass'};
}
root.RadioStats={calculate};
if(typeof module!=='undefined')module.exports={calculate};
})(typeof window!=='undefined'?window:globalThis);
