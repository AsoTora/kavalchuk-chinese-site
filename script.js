const timezoneInput=document.getElementById('enquiry-timezone'),timezoneCity=document.getElementById('timezone-city');
const cityZones={
'Варшава':'Europe/Warsaw','Краков':'Europe/Warsaw','Вроцлав':'Europe/Warsaw','Гданьск':'Europe/Warsaw','Познань':'Europe/Warsaw','Минск':'Europe/Minsk','Брест':'Europe/Minsk','Гродно':'Europe/Minsk','Гомель':'Europe/Minsk','Витебск':'Europe/Minsk','Могилёв':'Europe/Minsk',
'Москва':'Europe/Moscow','Санкт-Петербург':'Europe/Moscow','Казань':'Europe/Moscow','Сочи':'Europe/Moscow','Калининград':'Europe/Kaliningrad','Самара':'Europe/Samara','Екатеринбург':'Asia/Yekaterinburg','Тюмень':'Asia/Yekaterinburg','Омск':'Asia/Omsk','Новосибирск':'Asia/Novosibirsk','Красноярск':'Asia/Krasnoyarsk','Иркутск':'Asia/Irkutsk','Якутск':'Asia/Yakutsk','Владивосток':'Asia/Vladivostok','Хабаровск':'Asia/Vladivostok','Магадан':'Asia/Magadan','Петропавловск-Камчатский':'Asia/Kamchatka',
'Тбилиси':'Asia/Tbilisi','Батуми':'Asia/Tbilisi','Ереван':'Asia/Yerevan','Баку':'Asia/Baku','Астана':'Asia/Almaty','Алматы':'Asia/Almaty','Ташкент':'Asia/Tashkent','Бишкек':'Asia/Bishkek','Дубай':'Asia/Dubai','Стамбул':'Europe/Istanbul',
'Пекин':'Asia/Shanghai','Шанхай':'Asia/Shanghai','Нинбо':'Asia/Shanghai','Нанкин':'Asia/Shanghai','Шэньян':'Asia/Shanghai','Гуанчжоу':'Asia/Shanghai','Шэньчжэнь':'Asia/Shanghai','Гонконг':'Asia/Hong_Kong','Тайбэй':'Asia/Taipei','Токио':'Asia/Tokyo','Сеул':'Asia/Seoul','Бангкок':'Asia/Bangkok','Бали':'Asia/Makassar',
'Берлин':'Europe/Berlin','Париж':'Europe/Paris','Прага':'Europe/Prague','Вена':'Europe/Vienna','Рим':'Europe/Rome','Мадрид':'Europe/Madrid','Лиссабон':'Europe/Lisbon','Лондон':'Europe/London','Вильнюс':'Europe/Vilnius','Рига':'Europe/Riga','Таллин':'Europe/Tallinn','Хельсинки':'Europe/Helsinki','Киев':'Europe/Kiev','Нью-Йорк':'America/New_York','Лос-Анджелес':'America/Los_Angeles','Торонто':'America/Toronto','Сидней':'Australia/Sydney'};
const normalizeCity=s=>s.trim().toLocaleLowerCase('ru').replaceAll('ё','е');
const timezoneChoices=new Map(Object.entries(cityZones).map(([city,zone])=>[normalizeCity(city),zone]));
for(let hour=-12;hour<=14;hour++){const label='UTC'+(hour>=0?'+':'')+hour;timezoneChoices.set(normalizeCity(label),hour===0?'Etc/UTC':'Etc/GMT'+(hour>0?'-':'+')+Math.abs(hour));}
let zones=[];try{zones=Intl.supportedValuesOf('timeZone');}catch{}
const labels=[...Object.keys(cityZones),...Array.from({length:27},(_,i)=>'UTC'+(i-12>=0?'+':'')+(i-12))];
document.getElementById('timezone-options').replaceChildren(...labels.map(label=>{const o=document.createElement('option');o.value=label;return o;}));
function checkTimezone(){const value=timezoneCity.value.trim(),zone=timezoneChoices.get(normalizeCity(value))||value;try{new Intl.DateTimeFormat('ru',{timeZone:zone});timezoneInput.value=zone;timezoneCity.setCustomValidity('');}catch{timezoneInput.value='';timezoneCity.setCustomValidity('Выберите город из подсказок или укажите UTC, например UTC+3.');}}
function initTimezone(){let zone='';try{zone=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch{}timezoneInput.value=zone;timezoneCity.value=Object.keys(cityZones).find(city=>cityZones[city]===zone)||zone;timezoneCity.setCustomValidity('');}
initTimezone();timezoneCity.addEventListener('input',checkTimezone);
const form=document.getElementById('enquiry-form'),status=document.getElementById('form-status'),submitButton=form.querySelector('[type=submit]');
let requestId=crypto.randomUUID(),submitting=false;
const contactInput=form.elements.contact;
function checkContact(){const value=contactInput.value.trim();const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||/^(?:@|(?:https?:\/\/)?(?:www\.)?t\.me\/)[a-z][a-z0-9_]{4,31}\/?$/i.test(value);contactInput.setCustomValidity(valid?'':'Укажите email, Telegram в формате @username или ссылку t.me.');}
contactInput.addEventListener('input',checkContact);
document.querySelectorAll('[data-plan]').forEach(a=>a.addEventListener('click',()=>{form.elements.pair.value=a.dataset.plan;}));
form.addEventListener('submit',async event=>{event.preventDefault();checkContact();checkTimezone();if(submitting||!form.reportValidity())return;submitting=true;submitButton.disabled=true;submitButton.textContent='Отправляем…';status.className='';status.textContent='Сохраняем вашу заявку.';const data=new FormData(form);data.set('request_id',requestId);data.set('locale','ru');try{const response=await fetch('https://kavalchuk-chinese.kavalchuk.workers.dev/api/enquiries',{method:'POST',body:data});const result=await response.json();if(!response.ok||!result.ok)throw new Error('Submission not confirmed');status.className='success';status.textContent='Спасибо! Заявка сохранена. Я свяжусь с вами по указанному контакту.';form.reset();initTimezone();contactInput.setCustomValidity('');requestId=crypto.randomUUID();}catch{status.className='error';status.textContent='Сохранение не подтверждено. Попробуйте ещё раз или напишите мне в Telegram @catforchina. Все заполненные поля сохранены в форме.';}finally{submitting=false;submitButton.disabled=false;submitButton.textContent='Оставить заявку';}});
const preview=document.getElementById('document-hover-preview'),previewImages=preview.querySelector('.document-preview-images'),previewTitle=preview.querySelector('p');let active=null,documentsPromise;const imageCache=new Map();
function loadDocuments(){return documentsPromise??=fetch('/kavalchuk-chinese-site/document-assets.json').then(r=>{if(!r.ok)throw new Error('Certificate list unavailable');return r.json();}).catch(e=>{documentsPromise=null;throw e;});}
function cachedImage(src){if(!imageCache.has(src)){const img=new Image();img.decoding='async';img.src=src;imageCache.set(src,img);}return imageCache.get(src);}
function positionPreview(){if(!active||preview.hidden)return;const rect=active.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight){hidePreview();return;}const box=preview.getBoundingClientRect(),gap=10;preview.style.left=Math.max(12,Math.min(rect.left,innerWidth-box.width-12))+'px';const below=rect.bottom+gap;let top=below+box.height<=innerHeight-12?below:rect.top-box.height-gap;preview.style.top=Math.max(12,Math.min(top,innerHeight-box.height-12))+'px';}
function hidePreview(){preview.hidden=true;active?.setAttribute('aria-expanded','false');active=null;}
async function showPreview(button){if(active===button&&!preview.hidden){positionPreview();return;}hidePreview();active=button;button.setAttribute('aria-expanded','true');try{const assets=await loadDocuments();if(active!==button)return;const sources=assets[button.dataset.documentOpen];if(!sources?.length){hidePreview();return;}previewImages.replaceChildren(...sources.map((src,index)=>{const img=cachedImage(src);img.alt=button.textContent.trim()+(sources.length>1?' · документ '+(index+1):'');return img;}));preview.classList.toggle('multiple-documents',sources.length>1);previewTitle.textContent=button.textContent.trim();preview.hidden=false;positionPreview();}catch{if(active===button)hidePreview();}}
document.querySelectorAll('[data-document-open]').forEach(button=>{button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')showPreview(button);});button.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch'&&document.activeElement!==button)hidePreview();});button.addEventListener('focus',()=>showPreview(button));button.addEventListener('blur',hidePreview);button.addEventListener('click',()=>showPreview(button));});
// Fetch the map immediately and warm image caches before the education section is reached.
loadDocuments().catch(()=>{});let warmed=false;async function warmCertificates(){if(warmed)return;warmed=true;try{const assets=await loadDocuments();Object.values(assets).flat().forEach(cachedImage);}catch{warmed=false;}}
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){warmCertificates();observer.disconnect();}},{rootMargin:'1200px'});observer.observe(document.getElementById('education'));}else warmCertificates();
document.querySelector('.education-details').addEventListener('toggle',warmCertificates);
document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-document-open]'))hidePreview();});document.addEventListener('keydown',e=>{if(e.key==='Escape')hidePreview();});addEventListener('scroll',positionPreview,{passive:true});addEventListener('resize',positionPreview);
const reviewTrack=document.querySelector('.review-track'),reviewCards=[...document.querySelectorAll('.review-card')],previousReview=document.getElementById('review-prev'),nextReview=document.getElementById('review-next'),reviewPosition=document.getElementById('review-position');
const reviewCount=reviewCards.length, originals=[...reviewCards];
function duplicateReview(card){const copy=card.cloneNode(true);copy.querySelectorAll('[data-site-text]').forEach(el=>el.removeAttribute('data-site-text'));return copy;}
reviewTrack.prepend(...originals.map(duplicateReview));reviewTrack.append(...originals.map(duplicateReview));reviewCards.splice(0,reviewCards.length,...reviewTrack.querySelectorAll('.review-card'));
let activeReviewIndex=reviewCount,reviewTarget=0,reviewAnimation=0;
function centerOf(card){return card.offsetLeft+card.offsetWidth/2-reviewTrack.clientWidth/2;}
function updateReviews(){const center=reviewTrack.scrollLeft+reviewTrack.clientWidth/2;let nearest=0,distance=Infinity;reviewCards.forEach((card,i)=>{const d=Math.abs(card.offsetLeft+card.offsetWidth/2-center);if(d<distance){nearest=i;distance=d;}});activeReviewIndex=nearest;reviewCards.forEach((card,i)=>card.classList.toggle('review-active',i===nearest));previousReview.disabled=false;nextReview.disabled=false;reviewPosition.textContent=String(nearest%reviewCount+1).padStart(2,'0')+' / '+reviewCount;}
function normalizeReviews(){updateReviews();if(activeReviewIndex<reviewCount||activeReviewIndex>=reviewCount*2){const replacement=reviewCount+activeReviewIndex%reviewCount;const shift=reviewCards[replacement].offsetLeft-reviewCards[activeReviewIndex].offsetLeft;reviewTrack.scrollLeft+=shift;reviewTarget+=shift;updateReviews();}}
function animateReviews(){const delta=reviewTarget-reviewTrack.scrollLeft;if(Math.abs(delta)<.6){reviewTrack.scrollLeft=reviewTarget;reviewAnimation=0;normalizeReviews();return;}reviewTrack.scrollLeft+=delta*.16;reviewAnimation=requestAnimationFrame(animateReviews);}
function goReview(target){reviewTarget=Math.max(0,Math.min(target,reviewTrack.scrollWidth-reviewTrack.clientWidth));if(matchMedia('(prefers-reduced-motion:reduce)').matches){reviewTrack.scrollLeft=target;normalizeReviews();return;}if(!reviewAnimation)reviewAnimation=requestAnimationFrame(animateReviews);}
function moveReview(direction){updateReviews();const index=Math.max(0,Math.min(reviewCards.length-1,activeReviewIndex+direction));goReview(centerOf(reviewCards[index]));}
reviewCards.forEach(card=>{const img=card.querySelector('img'),w=Number(img.getAttribute('width')),h=Number(img.getAttribute('height'));const width=Math.min(650,Math.max(330,w*.8),560*w/h);card.style.setProperty('--review-width',width+'px');img.loading='eager';img.addEventListener('load',updateReviews);});
previousReview.addEventListener('click',()=>moveReview(-1));nextReview.addEventListener('click',()=>moveReview(1));reviewTrack.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveReview(e.key==='ArrowRight'?1:-1);}});
reviewTrack.addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(!reviewAnimation)reviewTarget=reviewTrack.scrollLeft;goReview(reviewTarget+delta*(e.deltaMode===1?26:1)*1.3);},{passive:false});
let reviewIdle;reviewTrack.addEventListener('scroll',()=>{updateReviews();clearTimeout(reviewIdle);reviewIdle=setTimeout(()=>{if(!reviewAnimation)normalizeReviews();},150);},{passive:true});
function initReviews(){reviewTrack.scrollLeft=centerOf(reviewCards[reviewCount]);reviewTarget=reviewTrack.scrollLeft;updateReviews();}addEventListener('resize',initReviews);requestAnimationFrame(initReviews);
const reviewDialog=document.getElementById('review-dialog'),largeReview=document.getElementById('review-large');let reviewOpener;
document.querySelectorAll('[data-review]').forEach(button=>button.addEventListener('click',()=>{reviewOpener=button;largeReview.src=button.dataset.review;largeReview.alt='Скриншот отзыва или результата HSK '+button.dataset.reviewNumber;document.getElementById('review-dialog-title').textContent='Отзыв / результат · '+button.dataset.reviewNumber+' из '+reviewCount;reviewDialog.showModal();document.body.style.overflow='hidden';reviewDialog.querySelector('.review-dialog-body').scrollTop=0;}));
function closeReview(){reviewDialog.close();}document.getElementById('review-close').addEventListener('click',closeReview);reviewDialog.addEventListener('click',e=>{if(e.target===reviewDialog){const r=reviewDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeReview();}});reviewDialog.addEventListener('close',()=>{document.body.style.overflow='';largeReview.removeAttribute('src');reviewOpener?.focus({preventScroll:true});});

const orgPreview=document.getElementById('organization-preview');let orgActive=null,orgHideTimer;const orgData=fetch('/kavalchuk-chinese-site/organizations.json').then(r=>r.json()).then(async data=>{const texts=await (window.siteContentReady||Promise.resolve({}));for(const [key,item] of Object.entries(data)){for(const field of ['name','city'])item[field]=texts[`org-${key}-${field}`]??item[field];item.stats=item.stats.map((row,i)=>row.map((value,j)=>texts[`org-${key}-stats-${i}-${j}`]??value));item.badges=item.badges.map((value,i)=>texts[`org-${key}-badges-${i}`]??value);}return data;});
function hideOrganization(){clearTimeout(orgHideTimer);orgPreview.hidden=true;orgActive?.setAttribute('aria-expanded','false');orgActive=null;}
function positionOrganization(){if(!orgActive||orgPreview.hidden)return;const r=orgActive.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight){hideOrganization();return;}const b=orgPreview.getBoundingClientRect();orgPreview.style.left=Math.max(12,Math.min(r.left,innerWidth-b.width-12))+'px';const below=r.bottom+10;orgPreview.style.top=Math.max(12,Math.min(below+b.height<=innerHeight-12?below:r.top-b.height-10,innerHeight-b.height-12))+'px';}
async function showOrganization(button){clearTimeout(orgHideTimer);orgActive?.setAttribute('aria-expanded','false');orgActive=button;const data=await orgData.catch(()=>null);if(orgActive!==button||!data?.[button.dataset.organization])return;const item=data[button.dataset.organization];orgPreview.replaceChildren();const title=document.createElement('h3');title.textContent=item.name;const city=document.createElement('p');city.className='org-city';city.textContent=item.city;const stats=document.createElement('div');stats.className='org-stats';for(const [value,label] of item.stats){const row=document.createElement('div');row.className='org-stat';const b=document.createElement('b');b.textContent=value;const text=document.createElement('span');text.textContent=label;row.append(b,text);stats.append(row);}const badges=document.createElement('div');badges.className='org-badges';for(const label of item.badges){const span=document.createElement('span');span.textContent=label;badges.append(span);}orgPreview.append(title,city,stats,badges);button.setAttribute('aria-expanded','true');orgPreview.hidden=false;positionOrganization();}
function delayHideOrganization(){orgHideTimer=setTimeout(hideOrganization,180);}
document.querySelectorAll('[data-organization]').forEach(button=>{button.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')showOrganization(button);});button.addEventListener('pointerleave',delayHideOrganization);button.addEventListener('focus',()=>showOrganization(button));button.addEventListener('blur',delayHideOrganization);button.addEventListener('click',()=>showOrganization(button));});orgPreview.addEventListener('pointerenter',()=>clearTimeout(orgHideTimer));orgPreview.addEventListener('pointerleave',delayHideOrganization);document.addEventListener('pointerdown',e=>{if(!orgPreview.contains(e.target)&&!e.target.closest('[data-organization]'))hideOrganization();});document.addEventListener('keydown',e=>{if(e.key==='Escape')hideOrganization();});window.addEventListener('scroll',positionOrganization,{passive:true});window.addEventListener('resize',positionOrganization);

// Collapse the long education list while keeping its summary in view.
document.querySelectorAll('[data-education-collapse]').forEach(button => {
 button.addEventListener('click', () => {
  const details = button.closest('details');
  if (!details) return;
  details.open = false;
  const summary = details.querySelector('summary');
  summary?.focus({preventScroll:true});
  details.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
 });
});

// Floating education actions stay available until the enquiry form comes into view.
(() => {
 const details = document.querySelector('.education-details');
 const actions = details?.querySelector('.education-bottom-actions');
 const form = document.querySelector('#enquiry-form');
 if (!details || !actions || !form) return;
 const update = () => {
  const bounds = details.querySelector('.education-expanded').getBoundingClientRect();
  const visible = details.open && bounds.top < innerHeight && bounds.bottom > 0 && form.getBoundingClientRect().top > innerHeight;
  actions.classList.toggle('is-visible', visible);
  actions.inert = !visible;
 };
 details.addEventListener('toggle', update);
 addEventListener('scroll', update, {passive:true});
 addEventListener('resize', update);
 update();
})();
