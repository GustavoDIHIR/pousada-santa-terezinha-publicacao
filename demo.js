import {paymentOptions,reservationEmail} from './reservation-utils.js';
// Exclusivo do protótipo estático: simulação local, sem autenticação ou agenda reais.
import { seedRooms, seedProperty } from './demo-seed.js';
const storageKey = 'pousada-prototipo-v1:' + location.pathname;
const originalFetch = window.fetch.bind(window);
const day = 86400000;
const today = () => new Date().toLocaleDateString('sv-SE', {timeZone:'America/Sao_Paulo'});
const id = (bytes = 9) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
const clone = value => structuredClone(value);
const fail = (message,status=400) => { throw Object.assign(new Error(message),{status}); };
const json = (data,status=200) => Response.json(data,{status});
const bytes = encoded => Uint8Array.from(atob(encoded),char=>char.charCodeAt(0));
const encode = buffer => { let result='';for(const byte of buffer)result+=String.fromCharCode(byte);return btoa(result); };
async function passwordHash(password,salt){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 return encode(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(salt),iterations:100000},key,256)));
}
async function sampleAccount(role,isManager=false){
 const salt=id();return {id:role+(isManager?'-gestor':''),email:(isManager?'gestor':role==='client'?'cliente':'admin')+'@example.test',role,isManager,isActive:true,fullName:isManager?'Gestor de Demonstração':role==='client'?'Cliente de Demonstração':'Administrador de Demonstração',phone:'12999999999',salt,passwordHash:await passwordHash('Demonstracao123!',salt)};
}
async function initialState(){return {rooms:clone(seedRooms),property:clone(seedProperty),reservations:[],receipts:{},accounts:await Promise.all([sampleAccount('client'),sampleAccount('admin'),sampleAccount('admin',true)]),session:null};}
let state;
try {const saved=JSON.parse(sessionStorage.getItem(storageKey));if(saved?.accounts&&Array.isArray(saved.rooms))state=saved;}catch{}
state ||= await initialState();
const user = () => state.accounts.find(account=>account.id===state.session&&account.isActive);
const view = account => account?Object.fromEntries(['email','fullName','phone','role','isManager'].map(key=>[key,account[key]])):null;
const requireUser=()=>user()||fail('Entre na sua conta de demonstração.',401);
const requireAdmin=()=>{const account=requireUser();if(account.role!=='admin')fail('Acesso administrativo necessário.',403);return account;};
const requireManager=()=>{const account=requireAdmin();if(!account.isManager)fail('Somente o gestor pode gerenciar administradores.',403);return account;};
const currentRooms=()=>state.rooms.filter(room=>!room.deleted);
const activeBookings=room=>state.reservations.filter(booking=>booking.offer.room===room.id&&!booking.cancelled);
function availableBeds(room,arrival,departure){
 const overlapping=activeBookings(room).filter(booking=>booking.offer.arrival<departure&&booking.offer.departure>arrival);
 if(room.type!=='shared')return overlapping.length?0:room.capacity;
 let peak=0;
 for(let date=Date.parse(arrival);date<Date.parse(departure);date+=day){
  const current=new Date(date).toISOString().slice(0,10);
  const used=overlapping.filter(booking=>booking.offer.arrival<=current&&booking.offer.departure>current).reduce((sum,booking)=>sum+booking.offer.adults+booking.offer.children,0);
  peak=Math.max(peak,used);
 }
 return Math.max(0,room.capacity-peak);
}
const catalog=()=>currentRooms().map(room=>({...room,availableBeds:availableBeds(room,today(),new Date(Date.parse(today())+day).toISOString().slice(0,10)),availabilityScope:'today'}));
const adminData=()=>({rooms:catalog(),reservations:state.reservations,images:[]});
function validCriteria(input){
 const validDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
 if(!validDate(input.arrival)||!validDate(input.departure)||input.arrival<today()||input.departure<=input.arrival||(Date.parse(input.departure)-Date.parse(input.arrival))/day>30||!Number.isInteger(input.adults)||input.adults<1||!Number.isInteger(input.children)||input.children<0||input.adults+input.children>12)fail('Escolha até 30 diárias, com pelo menos 1 adulto e até 12 hóspedes.');
}
function offers(input){
 validCriteria(input);const {arrival,departure,adults,children}=input;const guests=adults+children;const nights=(Date.parse(departure)-Date.parse(arrival))/day;
 return currentRooms().map(room=>({...room,availableBeds:availableBeds(room,arrival,departure),availabilityScope:'period'})).filter(room=>room.active&&(!input.room||room.id===input.room)&&room.availableBeds>=guests).map(room=>({...room,options:room.plans.map((plan,index)=>{
  const nightly=plan.nightly*(room.type==='shared'?guests:1);
  return {room:room.id,name:room.name,arrival,departure,adults,children,nights,nightly,unitNightly:plan.nightly,priceUnit:room.type==='shared'?'guest':'room',breakfast:false,planName:plan.name,dailyExtra:0,total:nights*nightly,key:[room.id,index,plan.nightly,arrival,departure,adults,children].join(':')};
 })}));
}
function bookingFor(code){
 const account=requireUser();const booking=state.reservations.find(booking=>booking.code===String(code||'').trim().toUpperCase());
 if(!booking||(account.role!=='admin'&&booking.ownerRef!==account.id))fail('Reserva não encontrada para esta conta.',404);
 return booking;
}
function contact(input){
 const fullName=String(input.fullName||'').trim();const phone=String(input.phone||'').trim();
 if(fullName.length<3||fullName.length>120||!fullName.includes(' ')||!/^\+?[\d ()-]{8,32}$/.test(phone)||phone.replace(/\D/g,'').length<8||phone.replace(/\D/g,'').length>15)fail('Informe nome completo e telefone com 8 a 15 dígitos. Use dados fictícios.');
 return {fullName,phone};
}
const hasBookings=room=>activeBookings(room).some(booking=>booking.offer.departure>=today());
const validMoney=value=>Number.isInteger(value)&&value>0&&value<=10000000;
const validImage=value=>seedRooms.some(room=>room.images.includes(value))||typeof value==='string'&&value.length<=420000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
async function accountAction(action,input){
 if(action==='session')return {user:view(user())};
 if(action==='logout'){state.session=null;return {user:null};}
 if(action==='profile'){Object.assign(requireUser(),contact(input));return {user:view(user())};}
 if(action==='reservations'){const account=requireUser();if(account.role!=='client')fail('Entre como cliente.',403);return {reservations:state.reservations.filter(booking=>booking.ownerRef===account.id)};}
 if(action==='delete'){
  const account=requireUser();if(account.role!=='client')fail('A conta administrativa não pode ser excluída aqui.',403);
  if(await passwordHash(String(input.password||''),account.salt)!==account.passwordHash)fail('Confirme a senha da conta de teste.',403);
  state.accounts=state.accounts.filter(item=>item!==account);state.reservations.forEach(booking=>{if(booking.ownerRef===account.id){booking.ownerRef=null;booking.accountBound=false;}});state.session=null;return {user:null};
 }
 if(action==='create-administrator')requireManager();
 if(!['login','register','create-administrator'].includes(action))fail('Operação indisponível.',404);
 const email=String(input.email||'').trim().toLowerCase();const password=input.password;
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||typeof password!=='string'||password.length<12||password.length>128)fail('Informe e-mail de teste e senha exclusiva de 12 a 128 caracteres.');
 const existing=state.accounts.find(account=>account.email===email);
 if(action==='login'){
  if(!existing||!existing.isActive||await passwordHash(password,existing.salt)!==existing.passwordHash)fail('E-mail ou senha inválidos.',401);
  state.session=existing.id;return {user:view(existing)};
 }
 if(existing)fail('Este e-mail já está cadastrado.',409);
 const salt=id();const account={id:id(),email,salt,passwordHash:await passwordHash(password,salt),role:action==='register'?'client':'admin',isManager:false,isActive:true,...(action==='register'?contact(input):{fullName:'',phone:''})};
 state.accounts.push(account);if(action==='create-administrator')return {created:true};state.session=account.id;return {user:view(account)};
}
async function receiptAction(input,editing){
 if(editing)requireAdmin();const booking=bookingFor(input.code);
 const paymentLabels={'':'Não registrado',pix:'Pix',credit:'Cartão de crédito',debit:'Cartão de débito',cash:'Dinheiro',transfer:'Transferência bancária'};
 const saved=state.receipts[booking.code]||{paymentMethod:booking.paymentMethod||'',files:[]};let files=saved.files;const method=input.paymentMethod??saved.paymentMethod;
 const receipt=await import('./receipt.js');
 if(editing&&(input.save||input.preview)){
  if(!Object.hasOwn(paymentLabels,method)||!Array.isArray(input.documents)||input.documents.length>3)fail('Revise pagamento e anexos.');
  files=[];
  for(const document of input.documents){
   if(document.id){const stored=saved.files.find(file=>file.id===document.id);if(!stored||files.some(file=>file.id===stored.id))fail('Anexo inválido.');files.push(stored);continue;}
   if(typeof document.name!=='string'||document.name.length>120||!document.name.toLowerCase().endsWith('.pdf')||typeof document.pdf!=='string'||document.pdf.length>2800000)fail('Use PDFs de até 2 MB.');
   const clean=await receipt.sanitizeAttachment(bytes(document.pdf));files.push({id:id(12).toLowerCase(),name:document.name,pages:clean.pages,pdf:encode(clean.pdf)});
  }
  if(files.reduce((sum,file)=>sum+file.pages,0)>15)fail('Os anexos devem somar até 15 páginas.');
  if(input.save)state.receipts[booking.code]={paymentMethod:method,files};
 }
 if(!editing||input.preview){
  if(booking.cancelled||booking.approval!=='confirmed'&&!input.preview)fail('Aguarde a confirmação da pousada para baixar o comprovante.',409);
  const owner=state.accounts.find(account=>account.id===booking.ownerRef);
  const pdf=await receipt.makeReceipt({...booking,property:state.property,name:owner?.fullName||'Hóspede de demonstração',paymentMethod:paymentLabels[method]},files.map(file=>bytes(file.pdf)));
  return new Response(pdf,{headers:{'Content-Type':'application/pdf'}});
 }
 return {paymentMethod:method,attachments:files.map(({id,name})=>({id,name}))};
}
async function handle(path,input){
 if(path.startsWith('account/'))return accountAction(path.slice(8),input);
 requireUser();
 if(path==='catalog')return {rooms:catalog().filter(room=>room.active)};
 if(path==='search'){
  const rooms=offers(input);const room=currentRooms().find(room=>room.id===input.room&&room.active);
  return {rooms,...(room&&{availability:{availableBeds:availableBeds(room,input.arrival,input.departure),capacity:room.capacity}})};
 }
 if(path==='book'){
  if(!paymentOptions.some(option=>option.id===input.paymentMethod))fail('Escolha a forma de pagamento antes de enviar a reserva para análise.');
  const account=requireUser();if(account.role!=='client')fail('Use o perfil Cliente para testar uma reserva.',403);
  const offer=offers(input).flatMap(room=>room.options).find(offer=>offer.key===input.key);
  if(!offer)fail('A disponibilidade ou a tarifa mudou. Pesquise novamente.',409);
  const booking={approval:'pending',code:id(),checkedIn:false,cancelled:false,ownerRef:account.id,accountBound:true,purchaseNumber:id(12),paymentMethod:input.paymentMethod,createdAt:new Date().toISOString(),confirmedAt:null,checkInNumber:null,checkedInAt:null,offer};
  state.reservations.unshift(booking);return booking;
 }
 if(path==='reservation'||path==='checkin'){
  const booking=bookingFor(input.code);
  if(path==='checkin'){
   if(booking.cancelled||booking.approval!=='confirmed'||booking.offer.departure<=today())fail('A reserva deve estar confirmada e vigente para realizar check-in.',409);
   if(!booking.checkedIn){booking.checkedIn=true;booking.checkInNumber=id();booking.checkedInAt=new Date().toISOString();}
  }
  return booking;
 }
 if(path==='reservation/review'){
  requireAdmin();const reservation=bookingFor(input.code);const owner=state.accounts.find(account=>account.id===reservation.ownerRef);const customer=owner?{fullName:owner.fullName,email:owner.email,phone:owner.phone}:null;
  const notifications=customer?['submitted',...(reservation.approval==='confirmed'?['confirmed']:[])].map(kind=>({...reservationEmail({reservation,propertyName:state.property.name,type:kind,baseUrl:new URL('./',location.href).href}),kind,recipient:customer.email,status:'preview'})):[];
  return {reservation,customer,notifications,emailMode:'preview',whatsappConfigured:false};
 }
 if(path==='receipt'||path==='receipt/admin')return receiptAction(input,path.endsWith('/admin'));
 if(path==='property'){
  if(input.save){
   requireAdmin();const next=input.property;
   if(!next||Object.keys(next).some(key=>!Object.hasOwn(seedProperty,key)))fail('Apenas identidade e contato podem ser editados.');
   for(const key of Object.keys(seedProperty))if(typeof next[key]!=='string'||next[key].length>(key==='logo'?420000:key==='paymentInstructions'?3000:240))fail('Revise identidade e contato.');
   for(const key of ['instagram','facebook'])if(next[key]&&!/^https:\/\//.test(next[key]))fail('Use links HTTPS.');
   if(next.logo&&!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(next.logo))fail('Use logo PNG ou JPEG.');
   if(next.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.email))fail('E-mail inválido.');
   for(const key of ['checkInTime','checkOutTime'])if(next[key]&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(next[key]))fail('Horário inválido.');
   state.property=clone(next);
  }
  return {property:state.property};
 }
 if(path==='administrators'){
  const account=requireManager();
  if(input.action){
   if(!['activate','deactivate','delete'].includes(input.action))fail('Ação inválida.');
   const target=state.accounts.find(item=>item.email===input.email&&item.role==='admin');if(!target)fail('Administrador não encontrado.',404);
   if(target===account)fail('Você não pode alterar o próprio acesso de gestor.',409);
   if(input.action==='delete'){target.role='client';target.isManager=false;target.isActive=true;}else target.isActive=input.action==='activate';
  }
  return {administrators:state.accounts.filter(account=>account.role==='admin').map(item=>({...view(item),isActive:item.isActive,isSelf:item===account}))};
 }
 if(path==='demo-data'){
  requireAdmin();if(!['clear','restore'].includes(input.mode)||input.mode!==input.confirm)fail('Confirme a operação.');
  state.rooms=input.mode==='restore'?clone(seedRooms):[];state.property=clone(seedProperty);state.reservations=[];state.receipts={};return {reset:true};
 }
 if(path==='admin'){
  requireAdmin();
  if(input.confirmReservation){const booking=bookingFor(input.confirmReservation);if(booking.cancelled||booking.offer.departure<=today())fail('Reserva indisponível.',409);booking.approval='confirmed';booking.confirmedAt||=new Date().toISOString();}
  else if(input.cancelReservation){const booking=bookingFor(input.cancelReservation);if(booking.checkedIn||booking.cancelled||booking.offer.departure<=today())fail('Reserva indisponível para cancelamento.',409);booking.cancelled=true;}
  else if(input.deleteRoom||input.setRoomActive){
   const room=currentRooms().find(room=>room.id===(input.deleteRoom||input.setRoomActive));if(!room)fail('Quarto não encontrado.',404);
   if(hasBookings(room)&&(input.deleteRoom||input.active===false))fail('Há reservas em andamento. Preserve o quarto e as estadias existentes.',409);
   if(input.deleteRoom){room.deleted=true;room.active=false;}else{if(typeof input.active!=='boolean')fail('Estado inválido.');room.active=input.active;}
  }
  else if(input.name!==undefined||input.room!==undefined){
   const previous=currentRooms().find(room=>room.id===input.room);if(input.room&&!previous)fail('Quarto não encontrado.',404);
   if(previous&&hasBookings(previous)&&(previous.capacity!==input.capacity||previous.type!==input.type||previous.active&&!input.active))fail('Não inative nem altere capacidade ou tipo de quartos com reservas.',409);
   for(const [key,limit]of [['name',100],['description',1200],['beds',180]])if(typeof input[key]!=='string'||!input[key].trim()||input[key].length>limit)fail('Revise os dados do quarto.');
   if(!['private','shared'].includes(input.type)||!Number.isInteger(input.capacity)||input.capacity<1||input.capacity>12||typeof input.active!=='boolean'||!Array.isArray(input.images)||!input.images.length||input.images.length>5||!input.images.every(validImage)||new Set(input.images).size!==input.images.length)fail('Revise capacidade, tipo e até cinco fotos.');
   if(!Array.isArray(input.plans)||!input.plans.length||input.plans.length>10||!input.plans.every(plan=>typeof plan.name==='string'&&plan.name.trim()&&plan.name.length<=80&&validMoney(plan.nightly)))fail('Informe planos com nome e valor positivo.');
   if(!Array.isArray(input.amenities)||input.amenities.length>16||!input.amenities.every(item=>typeof item==='string'&&item.trim()&&item.length<=60))fail('Revise as comodidades.');
   const room={id:previous?.id||'quarto-'+id(6).toLowerCase(),...Object.fromEntries(['name','description','beds','type','capacity','images','amenities','nightly','nightlyWithBreakfast','meal','plans','active'].map(key=>[key,clone(input[key])])),image:input.images[0],fee:0};
   if(previous)state.rooms[state.rooms.indexOf(previous)]=room;else state.rooms.push(room);
  }
  return adminData();
 }
 fail('Operação indisponível no protótipo.',404);
}
// Serializa ações desta aba. Não substitui as transações e permissões do servidor real.
let queue=Promise.resolve();
window.fetch=(resource,options={})=>{
 const url=new URL(typeof resource==='string'?resource:resource.url,location.href);
 const match=url.origin===location.origin&&url.pathname.match(/(?:^|\/)api\/(.+)$/);
 if(!match)return originalFetch(resource,options);
 const operation=queue.then(async()=>{
  const before=clone(state);
  try{
   const input=options.body?JSON.parse(options.body):{};const result=await handle(match[1],input);
   try{sessionStorage.setItem(storageKey,JSON.stringify(state));}catch{fail('O armazenamento desta aba está cheio ou indisponível. Remova fotos/anexos ou reinicie o protótipo.',507);}
   return result instanceof Response?result:json(result);
  }catch(error){state=before;return json({error:error.message||'Não foi possível concluir a simulação.'},error.status||400);}
 });queue=operation.then(()=>{},()=>{});return operation;
};
function demoControls(){
 const bar=document.createElement('aside');bar.className='demo-controls';bar.setAttribute('aria-label','Controles do protótipo');
 const note=document.createElement('span');note.textContent='PROTÓTIPO · Dados fictícios nesta aba · Sem reservas reais · Direitos do site: © 2026 Gustavo Henrique De Inocencio Ribeiro.';bar.append(note);
 for(const[label,email,hash]of [['Cliente','cliente@example.test','#inicio'],['Administrador','admin@example.test','#admin'],['Gestor','gestor@example.test','#admin']]){
  const button=document.createElement('button');button.type='button';button.textContent='Testar como '+label;
  button.onclick=async()=>{const result=await window.fetch('/api/account/login',{method:'POST',body:JSON.stringify({email,password:'Demonstracao123!'})});if(!result.ok){alert((await result.json()).error);return;}location.hash=hash;location.reload();};bar.append(button);
 }
 const reset=document.createElement('button');reset.type='button';reset.textContent='Reiniciar protótipo';reset.onclick=()=>{if(confirm('Apagar apenas os dados de demonstração desta aba e restaurar os exemplos?')){sessionStorage.removeItem(storageKey);location.reload();}};bar.append(reset);document.body.prepend(bar);
 const intro=document.querySelector('#account-form-intro');if(intro)intro.textContent='Simulação local. Use os botões de teste acima ou cliente@example.test com a senha Demonstracao123!. Não informe dados ou senhas reais.';
 const privacy=document.querySelector('#privacidade');if(privacy){const notice=document.createElement('p');notice.className='fiction-banner';notice.textContent='Nesta publicação estática, contas, fotos, anexos e reservas são simulações guardadas apenas no sessionStorage desta aba. Os perfis podem ser alternados livremente para avaliação. Isso não representa autenticação segura nem disponibilidade compartilhada entre visitantes. Não use dados pessoais ou documentos reais.';privacy.prepend(notice);}
 document.querySelectorAll('#account-login input').forEach(input=>input.autocomplete='off');
}
if(document.readyState==='complete')demoControls();else document.addEventListener('DOMContentLoaded',demoControls);
