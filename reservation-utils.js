export const paymentOptions=[{id:'pix',label:'Pix'},{id:'credit',label:'Cartão de crédito'},{id:'debit',label:'Cartão de débito'},{id:'cash',label:'Dinheiro na pousada'},{id:'transfer',label:'Transferência bancária'}];
export const paymentLabel=value=>paymentOptions.find(option=>option.id===value)?.label||'Não informada';
export function reservationEmail({reservation,propertyName,type,baseUrl}){
 const approved=type==='confirmed';
 const url=new URL(baseUrl);url.hash='reserva/'+reservation.code;
 const date=value=>new Intl.DateTimeFormat('pt-BR',{timeZone:'UTC'}).format(new Date(value));
 const offer=reservation.offer;
 return {
  subject:(approved?'Reserva aprovada':'Solicitação recebida')+' · '+reservation.code,
  body:[propertyName,approved?'Sua reserva foi aprovada pela pousada.':'Recebemos sua solicitação de reserva. Ela está em análise pela pousada; a hospedagem ainda não está confirmada.',
   'Código: '+reservation.code,'Acomodação: '+offer.name,'Período: '+date(offer.arrival)+' a '+date(offer.departure),
   'Hóspedes: '+(offer.adults+offer.children),'Plano: '+(offer.planName||'Hospedagem'),
   'Total: '+new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(offer.total/100),
   'Forma de pagamento escolhida: '+paymentLabel(reservation.paymentMethod),
   'Escolher a forma de pagamento não representa uma cobrança nem comprova quitação.',
   'Acesse sua reserva, confira as informações e as ações disponíveis:',url.href,
   'Entre com a conta usada na solicitação. O link não substitui o login e não confirma nada automaticamente.',
   'Ambiente de teste: sem cobrança real.'].join('\n\n'),url:url.href,
 };
}
