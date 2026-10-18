(async()=>{
 const ready=window.siteContentReady||Promise.resolve();
 const result=fetch('https://kavalchuk-chinese.kavalchuk.workers.dev/api/visitor-country',{cache:'no-store',signal:AbortSignal.timeout(4000)}).then(r=>r.ok?r.json():{}).catch(()=>({}));
 const [,visitor]=await Promise.all([ready,result]);
 // Fixed owner-provided pricing ratios; these are not live exchange rates.
 const currencies={RU:{rate:100,label:'₽'},BY:{rate:110/35,label:'BYN'},KZ:{rate:17000/35,label:'₸'},CN:{rate:6.5,label:'¥'}};
 const currency=currencies[visitor.country]||{rate:1,label:'$'};
 for(const [id,usd] of Object.entries({'text-71':35,'text-59':12,'text-79':12,'text-420':200,'text-429':400})){
  const el=document.querySelector(`[data-site-text="${id}"]`);
  if(el)el.textContent='от '+Math.round(usd*currency.rate).toLocaleString('ru-RU')+' '+currency.label;
 }
})();
