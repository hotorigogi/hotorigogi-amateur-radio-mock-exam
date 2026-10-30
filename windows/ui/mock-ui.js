'use strict';
(function(){
let view='home',type='1',timer;
const exam=()=>progress.mockExams?.[type];
const active=e=>e&&e.submittedAt===null;
function switchView(next){view=next;syncVisibility();if(next==='exam')renderExam();$('viewTabs').scrollIntoView({block:'start',behavior:'smooth'});}
function syncVisibility(){
 $('appTitle').textContent='아마추어무선기사 연습프로그램';
 const one=RadioMock.practiceBank(bank,'1').length,three=RadioMock.practiceBank(bank,'3').length,shared=RadioMock.pool(bank,'3-phone','통신보안').length;
 $('bankSummary').textContent='통합 '+bank.length.toLocaleString()+'문항 · 1급 '+one.toLocaleString()+'문항 · 3급 대비 '+three.toLocaleString()+'문항(통신보안 '+shared+'문항 공유)';
 document.querySelector('.header-label').textContent='1급·3급 · '+bank.length.toLocaleString()+'문항 · 자동채점 · 해설 · 오프라인';
 $('grade').options[0].textContent='1급 · '+one.toLocaleString()+'문항';$('grade').options[1].textContent='3급 전화급 대비 · '+three.toLocaleString()+'문항';
 $('mockHome').hidden=view!=='home';$('mockPanel').hidden=view!=='exam';document.querySelector('.workspace').hidden=view!=='practice';$('practiceResults').hidden=view!=='practice';document.querySelector('.stats').hidden=view!=='practice';
 $('homeTab').classList.toggle('active',view!=='practice');$('practiceTab').classList.toggle('active',view==='practice');$('homeTab').setAttribute('aria-pressed',String(view!=='practice'));$('practiceTab').setAttribute('aria-pressed',String(view==='practice'));
 $('mockResume').hidden=!exam();$('mockResume').textContent=active(exam())?'진행 중인 '+RadioMock.config(type).name+' 계속':'최근 모의고사 결과 보기';
 for(const key of Object.keys(RadioMock.CONFIGS)){const e=progress.mockExams?.[key],b=document.querySelector('[data-resume="'+key+'"]');b.hidden=!e;b.textContent=active(e)?'이어서 풀기':'성적·해설 보기';const status=document.querySelector('[data-exam-state="'+key+'"]');status.textContent=e?active(e)?Object.keys(e.answers).length+' / '+e.ids.length+'문항 응답 · 진행 중':(RadioMock.score(e,bank).passed?'최근 결과 · 합격':'최근 결과 · 불합격'):'새로운 무작위 시험을 시작하세요';}
}
function clock(){
 let changed=false;for(const e of Object.values(progress.mockExams||{})){if(active(e)&&Date.now()>=e.deadline){e.submittedAt=e.deadline;changed=true;}}
 if(changed){save();syncVisibility();if(view==='exam')renderExam();toast('시험 시간이 끝나 모의고사를 자동 제출했어요.');}
 if(active(exam())){const secs=Math.max(0,Math.ceil((exam().deadline-Date.now())/1000));$('mockTime').textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');}
}
function finish(){
 const e=exam();if(!active(e))return;clock();if(!active(e))return;
 const missing=e.ids.length-Object.keys(e.answers).length;
 if(!confirm('모의고사를 최종 제출할까요?'+(missing?' 미응답 '+missing+'문항은 오답 처리돼요.':'')))return;
 e.submittedAt=Math.max(e.startedAt,Math.min(Date.now(),e.deadline));save();syncVisibility();renderExam();
}
function renderExam(){
 const e=exam();if(!e)return;const c=RadioMock.config(type),n=e.ids.length;
 const q=bank.find(q=>q.id===e.ids[e.index]),finished=e.submittedAt!==null,answer=e.answers[q.id];
 $('mockHeading').textContent=c.name+' 모의고사'+(finished?' 결과':'');
 $('mockRules').textContent=c.subjects.map(([s,n])=>s+' '+n).join(' · ')+'문항 / '+c.minutes+'분. 답안은 자동 저장되며 앱을 꺼도 시간은 계속 흘러갑니다. 최종 제출 전 정답·해설을 숨겨요.';
 $('mockCriteria').textContent='모든 과목 40점 이상 + '+c.subjects.length+'과목 점수의 평균 60점 이상이면 합격. 미응답은 오답 처리하며 일반 연습 성적과 별도로 계산해요. 과목 면제 없는 전체 시험 기준입니다.';
 $('mockOfficial').href=c.url;$('mockPoolNote').hidden=type==='1';
 $('mockTime').hidden=finished;$('mockFinish').hidden=finished;$('mockClear').hidden=finished;$('mockReport').hidden=!finished;
 $('mockPosition').textContent=(e.index+1)+' / '+n+' · '+Object.keys(e.answers).length+'문항 응답';
 $('mockQuestion').textContent=(e.index+1)+'. '+q.question;
 $('mockSubject').textContent=q.subject+' · 원문 '+q.display_number+'번'+(type==='3-phone'&&q.subject==='통신보안'?' · 공통 학습 / 1급 자료':'');
 $('mockFigure').hidden=!q.image;$('mockFigure').innerHTML=q.image?'<img src="'+esc(q.image)+'" alt="'+esc(q.image_alt)+'">':'';
 $('mockChoices').innerHTML=q.options.map((o,i)=>'<label class="choice '+(finished?(i+1===q.answer?'correct':answer===i+1?'incorrect':''):'')+'"><input type="radio" name="mockAnswer" value="'+(i+1)+'" '+(answer===i+1?'checked ':'')+(finished?'disabled':'')+'><span>'+(i+1)+'. '+esc(o)+'</span></label>').join('');
 $('mockExplanation').hidden=!finished;
 $('mockExplanation').innerHTML=finished?'<h3>'+(answer===q.answer?'정답':answer?'오답':'미응답')+'</h3><p>선택 '+(answer||'없음')+' · 정답 '+q.answer+'번</p>'+lawContextHTML(q)+'<section class="solution"><h4>문제 해설</h4><p>'+esc(q.explanation)+'</p></section>'+(q.source_answer_adopted?'<p class="warning">사용자 요청으로 원자료 답을 채택한 문항입니다.</p>':''):'';
 $('mockNumbers').innerHTML=e.ids.map((id,i)=>{const item=bank.find(q=>q.id===id),choice=e.answers[id];return '<button aria-label="모의고사 '+(i+1)+'번'+(choice?' 응답':' 미응답')+'" data-index="'+i+'" class="'+(i===e.index?'current ': '')+(finished?(choice===item.answer?'mock-correct':'mock-wrong'):choice?'mock-answered':'')+'">'+(i+1)+'</button>';}).join('');
 $('mockPrev').disabled=e.index===0;$('mockNext').disabled=e.index===n-1;
 if(finished){const s=RadioMock.score(e,bank);$('mockVerdict').textContent=s.passed?'모의고사 합격':'모의고사 불합격';$('mockVerdict').className='verdict '+(s.passed?'pass':'fail');$('mockSummary').textContent='과목 평균 '+s.average.toFixed(1)+'점 · 정답 '+s.correct+'/'+n+' · 미응답 '+s.unanswered+'문항(오답 포함)';$('mockRows').innerHTML=s.parts.map(p=>'<tr><th scope="row">'+p.subject+'</th><td>'+p.correct+' / '+p.total+'</td><td>'+p.wrong+'</td><td>'+p.score+'점</td><td>'+(p.score<40?'과락':'통과')+'</td></tr>').join('');}
 if(active(e)){const secs=Math.max(0,Math.ceil((e.deadline-Date.now())/1000));$('mockTime').textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');}
}
function start(key){
 if(!bank.length)return toast('문제은행을 불러오는 중이에요.');const old=progress.mockExams?.[key];
 if(old&&!confirm(RadioMock.config(key).name+'의 기존 모의고사 답안·결과를 새 시험으로 교체할까요? 다른 급수 기록은 유지돼요.'))return;
 try{progress.mockExams=progress.mockExams||{};progress.mockExams[key]=RadioMock.draw(bank,Math.random,Date.now(),key);type=key;save();switchView('exam');}catch(err){toast(err.message);}
}
for(const b of document.querySelectorAll('[data-start]'))b.onclick=()=>start(b.dataset.start);
for(const b of document.querySelectorAll('[data-resume]'))b.onclick=()=>{type=b.dataset.resume;clock();switchView('exam');};
$('homeTab').onclick=()=>switchView('home');$('practiceTab').onclick=()=>switchView('practice');$('practiceEntry').onclick=()=>switchView('practice');
$('mockStart').onclick=()=>switchView('home');$('mockNew').onclick=()=>start(type);
$('mockResume').onclick=()=>{clock();switchView('exam');};
$('mockBack').onclick=()=>{switchView('home');if(active(exam()))toast('답안은 저장됐어요. 시험 시간은 계속 흘러가요.');};
$('mockChoices').onchange=e=>{clock();if(!active(exam()))return;exam().answers[exam().ids[exam().index]]=Number(e.target.value);save();renderExam();};
$('mockClear').onclick=()=>{clock();if(!active(exam()))return;delete exam().answers[exam().ids[exam().index]];save();renderExam();};
$('mockFinish').onclick=finish;
function jump(index){clock();if(!exam())return;exam().index=index;save();renderExam();}
$('mockPrev').onclick=()=>jump(Math.max(0,exam().index-1));$('mockNext').onclick=()=>jump(Math.min(exam().ids.length-1,exam().index+1));
$('mockNumbers').onclick=e=>{const b=e.target.closest('button');if(b)jump(Number(b.dataset.index));};
document.addEventListener('keydown',e=>{if(view!=='exam'||!active(exam())||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.altKey||e.ctrlKey||e.metaKey)return;if(/^[1-4]$/.test(e.key))$('mockChoices').querySelector('input[value="'+e.key+'"]').click();});
window.RadioMockUI={ready(){const had=!!(progress.mockExam||Object.keys(progress.mockExams||{}).length);progress.mockExams=RadioMock.sessions(progress,bank);delete progress.mockExam;type='1';view='home';syncVisibility();clearInterval(timer);timer=setInterval(clock,1000);clock();save();if(had&&!Object.keys(progress.mockExams).length)toast('문제 개정으로 이전 모의고사를 불러올 수 없어 새 시험을 시작해 주세요.');}};
})();
