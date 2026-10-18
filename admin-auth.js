// Admin panel login: asks for the password, keeps the API token in localStorage, adds it to API calls.
(()=>{
 const API=document.currentScript.dataset.api,KEY='kavalchuk-admin-token';
 const get=()=>{try{return localStorage.getItem(KEY);}catch{return null;}};
 const set=t=>{try{t?localStorage.setItem(KEY,t):localStorage.removeItem(KEY);}catch{}};
 let pending=null;
 function showLogin(message){
  if(pending)return pending;
  pending=new Promise(resolve=>{
   const main=document.querySelector('main');main.hidden=true;
   const box=document.createElement('main');box.className='admin-login';
   box.innerHTML='<p class="eyebrow">Kavalchuk · Личный кабинет</p><h1>Вход</h1><form><label>Пароль<br><input type="password" name="password" autocomplete="current-password" required></label><p><button class="button dark" type="submit">Войти</button></p><p class="admin-login-status" role="status"></p></form>';
   const form=box.querySelector('form'),status=box.querySelector('.admin-login-status');
   status.textContent=message||'';
   form.addEventListener('submit',async e=>{
    e.preventDefault();status.textContent='Проверяем…';
    try{
     const r=await fetch(API+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:form.password.value})});
     const data=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(r.status===401?'Неверный пароль.':data.error||'Вход не удался.');
     set(data.token);box.remove();main.hidden=false;pending=null;resolve();
    }catch(err){status.textContent=err.message==='Failed to fetch'?'Сервер недоступен. Проверьте соединение или включите VPN.':err.message;}
   });
   main.before(box);box.querySelector('input').focus();
  });
  return pending;
 }
 window.adminApi={
  async fetch(path,opts={}){
   if(!get())await showLogin();
   const headers=new Headers(opts.headers||{});headers.set('Authorization','Bearer '+get());
   const r=await fetch(API+path,{...opts,headers});
   if(r.status===401){set(null);await showLogin('Сессия истекла, войдите снова.');return window.adminApi.fetch(path,opts);}
   return r;
  },
  async download(path,filename){
   const r=await window.adminApi.fetch(path);if(!r.ok)throw new Error('Файл недоступен');
   const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  },
  logout(){set(null);location.reload();}
 };
 document.addEventListener('click',e=>{if(e.target.closest('[data-admin-logout]')){e.preventDefault();window.adminApi.logout();}});
})();
