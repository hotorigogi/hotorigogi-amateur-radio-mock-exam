'use strict';
(function(){
 const workspace=document.querySelector('.workspace'),scoreButton=document.getElementById('mobileScores');
 const update=()=>{scoreButton.hidden=workspace.hidden;};
 new MutationObserver(update).observe(workspace,{attributes:true,attributeFilter:['hidden']});update();
 scoreButton.onclick=()=>{const open=document.body.classList.toggle('scores-open');scoreButton.textContent=open?'과목별 성적 접기':'과목별 성적 펼치기';scoreButton.setAttribute('aria-expanded',String(open));};
 function scrollQuestion(){const target=workspace.hidden?document.querySelector('#mockPanel article'):document.getElementById('card');if(!target.hidden)target.scrollIntoView({behavior:'smooth',block:'start'});}
 for(const id of ['prev','next','mockPrev','mockNext'])document.getElementById(id).addEventListener('click',scrollQuestion);
 document.getElementById('mockNumbers').addEventListener('click',e=>{if(e.target.closest('button')){document.querySelector('.mobile-number-map').open=false;scrollQuestion();}});
 document.querySelector('.mobile-filters').addEventListener('change',()=>{document.body.classList.remove('scores-open');scoreButton.textContent='과목별 성적 펼치기';});
 // Timer ticks may be suspended by Android; resume immediately checks the absolute deadline.
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.dispatchEvent(new Event('radio-resume'));});
})();
