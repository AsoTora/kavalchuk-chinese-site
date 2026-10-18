document.querySelectorAll('[data-hsk-level]').forEach(link=>{
  link.addEventListener('click',()=>{
    const field=document.querySelector('#enquiry-form [name="task"]');
    if(!field)return;
    field.value=`У меня уже HSK ${link.dataset.hskLevel}`;
    field.dispatchEvent(new Event('input',{bubbles:true}));
    field.focus({preventScroll:true});
    field.setSelectionRange(field.value.length,field.value.length);
  });
});
