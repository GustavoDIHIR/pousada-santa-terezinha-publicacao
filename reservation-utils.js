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
export function whatsappBotMenu(name='Pousada Santa Terezinha do Menino Jesus'){
 return [
  `Olá! Bem-vindo(a) ao atendimento automático da ${name}.`,
  'Escolha uma opção digitando o número de 1 a 10:',
  '',
  '1 - Reservar acomodação',
  '2 - Consultar minha reserva',
  '3 - Tarifas, planos e tipos de quartos',
  '4 - Horários de check-in e check-out',
  '5 - Café da manhã e Restaurante',
  '6 - Localização e distância da Canção Nova',
  '7 - Formas de pagamento aceitas',
  '8 - Comodidades, Wi-Fi e estrutura',
  '9 - Alteração e cancelamento de reserva',
  '10 - Falar com um atendente da pousada',
  '',
  'Digite 0 a qualquer momento para voltar a este menu.',
 ].join('\n');
}
export function whatsappFaqAnswer(optionNumber,{propertyName='Pousada Santa Terezinha do Menino Jesus',checkInTime='14:00',checkOutTime='12:00',baseUrl='https://gustavodihir.github.io/pousada-santa-terezinha-publicacao/'}={}){
 const site=new URL(baseUrl);
 const footer='\n\nDigite 1 para reservar, outro número (1 a 10) ou 0 para ver o menu.';
 switch(optionNumber){
  case 3:
   return [
    `📋 Tarifas, planos e tipos de quartos — ${propertyName}`,
    '• Quartos Privativos (valor por quarto/diária): Suíte Individual, Suíte Casal, Quarto Triplo e Quarto Família (a partir de R$ 180,00/diária).',
    '• Quartos Compartilhados (valor por vaga/hóspede/diária): Acomodações de 4, 6, 8 e 12 vagas em beliches (a partir de R$ 75,00 por vaga/diária).',
    '• Você pode escolher planos com ou sem café da manhã conforme disponibilidade do quarto.',
   ].join('\n')+footer;
  case 4:
   return [
    `🕒 Horários de Check-in e Check-out — ${propertyName}`,
    `• Check-in (entrada): a partir das ${checkInTime || '14:00'}.`,
    `• Check-out (saída): até as ${checkOutTime || '12:00'}.`,
    '• Após a aprovação da sua reserva pela pousada, você pode registrar o check-in diretamente em Minha conta no site.',
   ].join('\n')+footer;
  case 5:
   return [
    `☕ Café da manhã e Restaurante — ${propertyName}`,
    '• Contamos com restaurante próprio na pousada, com salão amplo, buffet variado, saladas e acompanhamentos.',
    '• No momento da reserva você pode selecionar a tarifa com café da manhã incluso quando disponível no plano da acomodação.',
   ].join('\n')+footer;
  case 6:
   return [
    `📍 Localização — ${propertyName}`,
    '• Estamos localizados em Cachoeira Paulista – SP, em frente ao Santuário da Canção Nova (acesso fácil a pé em poucos minutos).',
    `• Veja o endereço completo e o mapa no site: ${new URL('#localizacao',site).href}`,
   ].join('\n')+footer;
  case 7:
   return [
    `💳 Formas de Pagamento — ${propertyName}`,
    '• Aceitamos: Pix, Cartão de crédito, Cartão de débito, Dinheiro na pousada e Transferência bancária.',
    '• Ao solicitar a reserva você informa a modalidade desejada para análise da pousada.',
    '• Segurança: nunca envie número de cartão ou senhas por mensagens no WhatsApp.',
   ].join('\n')+footer;
  case 8:
   return [
    `🛏️ Comodidades e Estrutura — ${propertyName}`,
    '• Suítes Privativas: Ar-condicionado, Wi-Fi gratuito, TV, frigobar, banheiro privativo, roupa de cama e banho.',
    '• Quartos Compartilhados: Ar-condicionado, Wi-Fi gratuito, beliches organizados por vaga e banheiro compartilhado.',
    '• Ambiente familiar, tranquilo e preparado para romeiros, famílias e grupos.',
   ].join('\n')+footer;
  case 9:
   return [
    `🔄 Alteração e Cancelamento — ${propertyName}`,
    '• Solicitações em análise ou reservas confirmadas antes do check-in podem ser consultadas em Minha conta no site.',
    '• Para alterar datas ou cancelar uma reserva já enviada, acesse sua conta pelo link da reserva ou digite 10 para falar diretamente com a equipe da pousada.',
   ].join('\n')+footer;
  default:
   return null;
 }
}
