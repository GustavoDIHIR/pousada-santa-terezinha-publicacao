import './demo.js?v=78e49104';
const labels = {name:'Nome de apresentação',legalName:'Razão social',taxId:'CNPJ / identificação',address:'Endereço',city:'Cidade e estado',phone:'Telefone',whatsapp:'WhatsApp com DDD',email:'E-mail de contato',instagram:'Instagram (link HTTPS)',facebook:'Facebook (link HTTPS)',paymentMethods:'Formas de pagamento',paymentInstructions:'Orientações sobre pagamento',checkInTime:'Horário de check-in (HH:MM)',checkOutTime:'Horário de check-out (HH:MM)'};
let currentProperty;
async function post(path,data={}) {
  const response=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await response.json(); if(!response.ok)throw new Error(result.error||'Não foi possível concluir.');return result;
}
function element(tag,text,className) { const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node; }
function applyProperty(data) {
 currentProperty=data;document.title=(data.name||'Pousada Santa Terezinha')+' · Reservas';
 document.querySelectorAll('[data-property-name]').forEach(node=>node.textContent=data.name||'Pousada Santa Terezinha');
 document.querySelectorAll('[data-property-logo]').forEach(image=>{image.hidden=!data.logo;if(data.logo)image.src=data.logo;else image.removeAttribute('src');});
 document.querySelectorAll('[data-property-logo-placeholder]').forEach(node=>node.toggleAttribute('hidden',Boolean(data.logo)));
 document.querySelectorAll('[data-property-checkin]').forEach(node=>node.textContent=data.checkInTime?'A partir das '+data.checkInTime:'Horário a confirmar');
 document.querySelectorAll('[data-property-checkout]').forEach(node=>node.textContent=data.checkOutTime?'Até as '+data.checkOutTime:'Horário a confirmar');
 document.querySelectorAll('address').forEach(node=>node.textContent=[data.address,data.city].filter(Boolean).join(' · '));
 document.querySelectorAll('a[href^="https://www.google.com/maps/dir/"]').forEach(link=>link.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent([data.address,data.city].filter(Boolean).join(', ')));
 const map=document.querySelector('.location-map iframe');const source='https://www.google.com/maps?q='+encodeURIComponent([data.address,data.city].filter(Boolean).join(', '))+'&output=embed';
 if(map.dataset.src!==source){map.removeAttribute('src');map.dataset.src=source;}
 const contacts=document.querySelector('#property-public-contacts');contacts?.replaceChildren();
 for(const[label,key,prefix]of[['Instagram','instagram',''],['Facebook','facebook',''],['Telefone','phone','tel:'],['E-mail','email','mailto:'],['WhatsApp','whatsapp','https://wa.me/']]){if(!data[key])continue;const link=element('a',label);let value=data[key];if(key==='whatsapp'){value=value.replace(/\D/g,'');if([10,11].includes(value.length))value='55'+value;}link.href=prefix+value;contacts?.append(link);}
 if(data.paymentMethods)contacts?.append(element('span','Formas de pagamento: '+data.paymentMethods));
 document.dispatchEvent(new CustomEvent('property-updated',{detail:data}));
}

const shell=document.querySelector('#admin-dashboard');
const nav=shell.querySelector('.admin-sidebar nav');
const main=shell.querySelector('.admin-main');
const panel=element('section',null,'property-panel');panel.hidden=true;main.append(panel);
const propertyButton=element('button','05 · Dados da pousada');propertyButton.type='button';nav.append(propertyButton);
const managersButton=element('button','06 · Administradores');managersButton.type='button';managersButton.hidden=true;nav.append(managersButton);
const demoButton=element('button','07 · Ambiente de testes');demoButton.type='button';nav.append(demoButton);
function show(title,description,button) {
  main.querySelectorAll('[data-admin-panel]').forEach(node=>node.hidden=true);
  document.querySelector('#admin-catalog-tools').hidden=true;document.querySelector('#admin-add-room').hidden=true;
  document.querySelector('#admin-view-title').textContent=title;document.querySelector('#admin-view-description').textContent=description;
  nav.querySelectorAll('button').forEach(node=>node.removeAttribute('aria-current'));button.setAttribute('aria-current','page');panel.hidden=false;panel.replaceChildren();
}
nav.querySelectorAll('[data-admin-view]').forEach(button=>button.addEventListener('click',()=>{panel.hidden=true;[propertyButton,managersButton,demoButton].forEach(node=>node.removeAttribute('aria-current'));}));
propertyButton.onclick=async()=>{
 show('Identidade e contato','Dados de identificação, contato e documentos da pousada.',propertyButton);
 const status=element('p','','status');panel.append(status);
 try{
  const {property}=await post('property');let logoDraft=property.logo||'';let uploading=false;
  const form=element('form',null,'property-page-form');form.append(element('h3','Identidade e contato'));const fields=element('div',null,'property-form');form.append(fields);
  for(const[key,title]of Object.entries(labels)){const label=element('label',title);const input=element(key==='paymentInstructions'?'textarea':'input');input.name=key;input.value=property[key]||'';input.maxLength=key==='paymentInstructions'?3000:240;if(input.tagName==='TEXTAREA')input.rows=4;if(['checkInTime','checkOutTime'].includes(key))input.type='time';label.append(input);fields.append(label);}
  const save=element('button','Salvar dados da pousada');save.type='submit';
  const box=element('div',null,'property-logo-editor');const preview=element('img');preview.alt='Logo da pousada';const label=element('label','Logo · PNG ou JPEG de até 300 KB');const file=element('input');file.type='file';file.accept='image/png,image/jpeg';file.dataset.propertyLogoUpload='';label.append(file);const remove=element('button','Usar logo original','account-secondary');remove.type='button';
  const paint=()=>{preview.src=logoDraft||'./logo.webp';remove.hidden=!logoDraft;};remove.onclick=()=>{logoDraft='';paint();};file.onchange=async()=>{const image=file.files[0];if(!image)return;if(!['image/png','image/jpeg'].includes(image.type)||image.size>300*1024){status.textContent='Use PNG ou JPEG de até 300 KB.';file.value='';return;}uploading=true;save.disabled=true;try{logoDraft=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(image);});paint();status.textContent='Logo preparada. Salve para aplicar.';}catch{status.textContent='Não foi possível carregar a logo.';}finally{uploading=false;save.disabled=false;file.value='';}};
  box.append(element('h3','Identidade visual'),label,preview,remove);form.append(box,save);panel.append(form);paint();
  form.onsubmit=async event=>{event.preventDefault();if(uploading)return;save.disabled=true;try{const result=await post('property',{save:true,property:{...Object.fromEntries(new FormData(form)),logo:logoDraft}});applyProperty(result.property);status.textContent='Identidade e contato atualizados.';}catch(error){status.textContent=error.message;}finally{save.disabled=false;}};
 }catch(error){status.textContent=error.message;}
};

let managerRevision=0;
let selectedAdministrator;
const managerDialog=element('dialog');managerDialog.setAttribute('aria-label','Confirmar alteração de administrador');
const managerHeading=element('h2');const managerDescription=element('p');const managerStatus=element('p','','status');
const managerCloseForm=element('form',null,'dialog-close');managerCloseForm.method='dialog';const managerClose=element('button','×');managerClose.setAttribute('aria-label','Fechar alteração de administrador');managerCloseForm.append(managerClose);
const managerCancel=element('button','Cancelar','account-secondary');managerCancel.type='button';managerCancel.onclick=()=>managerDialog.close();
const managerConfirm=element('button','Confirmar');managerConfirm.type='button';
managerDialog.append(managerCloseForm,managerHeading,managerDescription,managerStatus,managerCancel,managerConfirm);document.body.append(managerDialog);
function confirmAdministrator(user,action) {
  selectedAdministrator={email:user.email,action};managerStatus.textContent='';
  managerHeading.textContent=action==='delete'?'Excluir administrador?':action==='deactivate'?'Inativar administrador?':'Reativar administrador?';
  managerDescription.textContent=user.email+'. '+(action==='delete'?'O acesso administrativo será removido. A conta pessoal e as reservas serão preservadas.':action==='deactivate'?'O login será bloqueado e as sessões serão encerradas. A conta e as reservas serão preservadas.':'A conta poderá entrar novamente na administração com sua senha atual.');
  managerConfirm.textContent=action==='delete'?'Excluir acesso administrativo':action==='deactivate'?'Inativar administrador':'Reativar administrador';
  managerDialog.showModal();
}
managerConfirm.onclick=async()=>{
  if(!selectedAdministrator)return;
  const version=managerRevision;const selection={...selectedAdministrator};managerConfirm.disabled=true;managerStatus.textContent='';
  try{await post('administrators',selection);if(version!==managerRevision)return;managerDialog.close();await managersButton.onclick();}
  catch(error){if(version===managerRevision)managerStatus.textContent=error.message;}
  finally{managerConfirm.disabled=false;}
};
managersButton.onclick=async()=>{
  const version=++managerRevision;
  show('Administradores cadastrados','Somente o gestor pode ativar, inativar e excluir acessos administrativos.',managersButton);
  try{
    const result=await post('administrators');if(version!==managerRevision||managersButton.hidden)return;
    const createForm=element('form',null,'create-administrator-form surface');
    createForm.append(element('h3','Adicionar administrador'));
    const help=element('p','Cadastre um e-mail novo e uma senha de 12 a 128 caracteres. O acesso criado será de administrador, sem permissão de gestor.','muted');createForm.append(help);
    for(const [name,title,type]of [['email','E-mail','email'],['password','Senha inicial','password']]){
      const label=element('label',title);const input=element('input');input.name=name;input.type=type;input.required=true;input.maxLength=name==='email'?254:128;input.autocomplete=name==='password'?'new-password':'off';if(name==='password')input.minLength=12;label.append(input);createForm.append(label);
    }
    const createStatus=element('p','','status');createStatus.setAttribute('role','status');createStatus.dataset.newAdminStatus='';
    const createButton=element('button','Adicionar administrador');createButton.type='submit';createForm.append(createStatus,createButton);panel.append(createForm);
    createForm.onsubmit=async event=>{
      event.preventDefault();const revision=managerRevision;createButton.disabled=true;createStatus.textContent='';
      try{
        await post('account/create-administrator',{email:createForm.elements.email.value,password:createForm.elements.password.value});
        if(revision!==managerRevision)return;
        await managersButton.onclick();const notice=panel.querySelector('[data-new-admin-status]');if(notice)notice.textContent='Administrador adicionado. Ele pode entrar em Minha conta com o e-mail e a senha cadastrados.';
      }catch(error){if(revision===managerRevision)createStatus.textContent=error.message;}
      finally{createForm.elements.password.value='';createButton.disabled=false;}
    };
    for(const user of result.administrators){
      const row=element('article',null,'surface administrator-card');
      row.append(element('h3',user.fullName||user.email),element('p',user.email),element('p',user.phone||'Telefone não informado'),element('p',(user.isManager?'Gestor':'Administrador')+' · '+(user.isActive?'Ativo':'Inativo')));
      if(user.isSelf)row.append(element('p','Sua conta de gestor: acesso protegido.','muted'));
      else{
        const actions=element('div',null,'admin-row-actions');
        const toggle=element('button',user.isActive?'Inativar':'Reativar','account-secondary');toggle.type='button';toggle.onclick=()=>confirmAdministrator(user,user.isActive?'deactivate':'activate');
        const remove=element('button','Excluir administrador','account-danger');remove.type='button';remove.onclick=()=>confirmAdministrator(user,'delete');actions.append(toggle,remove);row.append(actions);
      }
      panel.append(row);
    }
  }catch(error){if(version===managerRevision)panel.append(element('p',error.message,'status'));}
};

const resetDialog=element('dialog');resetDialog.setAttribute('aria-label','Confirmar alteração dos dados de teste');document.body.append(resetDialog);
let resetMode;
const title=element('h2');const note=element('p');const status=element('p','','status');const close=element('button','Cancelar','account-secondary');close.type='button';close.onclick=()=>resetDialog.close();
const confirm=element('button','Confirmar operação');confirm.type='button';resetDialog.append(title,note,status,close,confirm);
confirm.onclick=async()=>{confirm.disabled=true;status.textContent='';try{await post('demo-data',{mode:resetMode,confirm:resetMode});location.reload();}catch(error){status.textContent=error.message;}finally{confirm.disabled=false;}};
demoButton.onclick=()=>{
  show('Ambiente de testes','Operações exclusivas deste protótipo.',demoButton);
  panel.append(element('p','E-mails, pagamentos reais e emissão fiscal não estão disponíveis nesta versão. O envio da confirmação por e-mail será implementado na versão final.','fiction-banner'));
  for(const[mode,label,description]of[['restore','Restaurar dados de demonstração','Apaga os quartos, planos, reservas, anexos e dados da pousada personalizados e restaura os 15 quartos de exemplo.'],['clear','Limpar dados para testar com dados próprios','Apaga os quartos, planos, reservas, anexos e dados da pousada personalizados. O catálogo ficará vazio, inclusive após reiniciar o site.']]){
    const button=element('button',label,'demo-reset-button');button.type='button';button.onclick=()=>{resetMode=mode;title.textContent=label;note.textContent=description+' As contas e os acessos de administrador serão preservados. Esta operação não pode ser desfeita.';status.textContent='';resetDialog.showModal();};panel.append(button);
  }
};
async function refresh(){try{const {user}=await post('account/session');managersButton.hidden=!(user?.role==='admin'&&user.isManager);if(user){const result=await post('property');applyProperty(result.property);}}catch{}}
document.addEventListener('account-session',event=>{managersButton.hidden=!(event.detail?.role==='admin'&&event.detail.isManager);if(event.detail)refresh();else{managerRevision++;selectedAdministrator=undefined;managerDialog.close();panel.hidden=true;panel.replaceChildren();resetDialog.close();document.querySelector('#property-public-contacts')?.replaceChildren();}});
refresh();
