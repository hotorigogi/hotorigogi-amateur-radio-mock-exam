'use strict';
(function(root){
const CONFIGS={
 '1':{name:'1급',grade:'1',minutes:90,subjects:[['전파법규',20],['통신보안',10],['전파공학',20],['영어',20],['무선통신술',20]],url:'https://www.cq.or.kr/qh_quagm02_005.do'},
 '3-phone':{name:'3급 전화급',grade:'3',minutes:50,subjects:[['전파법규',20],['통신보안',10],['무선설비 취급방법',20]],url:'https://www.cq.or.kr/qh_quagm02_008.do'}
};
const SUBJECTS=CONFIGS['1'].subjects,DURATION=90*60*1000;
function config(type='1'){const c=CONFIGS[type];if(!c)throw Error('지원하지 않는 시험이에요.');return c;}
function total(type='1'){return config(type).subjects.reduce((n,p)=>n+p[1],0);}
function pool(bank,type='1',subject){const c=config(type);return bank.filter(q=>q.subject===subject&&q.grade===(type==='3-phone'&&subject==='통신보안'?'1':c.grade)&&q.gradable&&Number.isInteger(q.answer)&&q.answer>=1&&q.answer<=4&&q.options.length===4);}
function practiceBank(bank,grade){return bank.filter(q=>q.grade===grade||(grade==='3'&&q.grade==='1'&&q.subject==='통신보안'));}
function draw(bank,rng=Math.random,now=Date.now(),type='1'){
 const c=config(type),ids=[],revisions={};
 for(const [subject,count] of c.subjects){const candidates=pool(bank,type,subject);
  if(candidates.length<count)throw Error(subject+' 출제 가능한 문항이 부족해요.');
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  for(const q of candidates.slice(0,count)){ids.push(q.id);revisions[q.id]=q.content_revision;}
 }
 return {version:2,type,ids,revisions,answers:{},index:0,startedAt:now,deadline:now+c.minutes*60000,submittedAt:null};
}
function normalize(value,bank){
 if(!value||![1,2].includes(value.version))return null;
 const type=value.version===1?'1':value.type,c=CONFIGS[type];if(!c)return null;
 const n=total(type);if(!Array.isArray(value.ids)||value.ids.length!==n||new Set(value.ids).size!==n)return null;
 const known=new Map(bank.map(q=>[q.id,q]));const revisions={};let offset=0;
 for(const [subject,count] of c.subjects){const eligible=new Set(pool(bank,type,subject).map(q=>q.id));for(const id of value.ids.slice(offset,offset+count)){const q=known.get(id);if(!eligible.has(id)||value.revisions?.[id]!==q.content_revision)return null;revisions[id]=q.content_revision;}offset+=count;}
 if(!Number.isSafeInteger(value.startedAt)||value.startedAt<0||value.deadline!==value.startedAt+c.minutes*60000)return null;
 if(value.submittedAt!==null&&(!Number.isSafeInteger(value.submittedAt)||value.submittedAt<value.startedAt||value.submittedAt>value.deadline))return null;
 if(!value.answers||typeof value.answers!=='object'||Array.isArray(value.answers))return null;
 const answers={};for(const [id,choice] of Object.entries(value.answers)){if(!value.ids.includes(Number(id))||!Number.isInteger(choice)||choice<1||choice>4)return null;answers[id]=choice;}
 return {version:2,type,ids:[...value.ids],revisions,answers,index:Number.isInteger(value.index)?Math.min(n-1,Math.max(0,value.index)):0,startedAt:value.startedAt,deadline:value.deadline,submittedAt:value.submittedAt};
}
function sessions(p,bank){
 const result={};for(const type of Object.keys(CONFIGS)){const e=normalize(p.mockExams?.[type],bank);if(e&&e.type===type)result[type]=e;}
 const legacy=normalize(p.mockExam,bank);if(legacy&&!result[legacy.type])result[legacy.type]=legacy;return result;
}
function score(exam,bank){
 const known=new Map(bank.map(q=>[q.id,q]));let offset=0;
 const parts=config(exam.type||'1').subjects.map(([subject,total])=>{let correct=0,unanswered=0;for(const id of exam.ids.slice(offset,offset+total)){if(!exam.answers[id])unanswered++;else if(exam.answers[id]===known.get(id)?.answer)correct++;}offset+=total;return {subject,total,correct,wrong:total-correct,unanswered,score:correct/total*100};});
 const average=parts.reduce((s,p)=>s+p.score,0)/parts.length;
 return {parts,average,passed:parts.every(p=>p.score>=40)&&average>=60,correct:parts.reduce((s,p)=>s+p.correct,0),unanswered:parts.reduce((s,p)=>s+p.unanswered,0)};
}
root.RadioMock={CONFIGS,SUBJECTS,DURATION,config,total,pool,practiceBank,draw,normalize,sessions,score};if(typeof module!=='undefined')module.exports=root.RadioMock;
})(typeof window!=='undefined'?window:globalThis);
