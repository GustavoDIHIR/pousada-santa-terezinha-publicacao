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
  `Olá! Bem-vindo(a) à ${name}.`,
  'Escolha uma opção (1 a 4):',
  '',
  '1 - Reservar acomodação',
  '2 - Minha reserva (consultar, check-in ou alterar)',
  '3 - Informações da pousada (tarifas, estrutura e local)',
  '4 - Falar com a pousada',
 ].join('\n');
}
export function whatsappSubmenu(group){
 if(group==='reservation_menu'){
  return [
   'Sobre sua reserva, escolha uma opção:',
   '1 - Consultar status pelo código da reserva',
   '2 - Horários de check-in, check-out e comprovante',
   '3 - Formas de pagamento e confirmação',
   '4 - Alteração ou cancelamento de reserva',
   '0 - Voltar ao menu principal',
  ].join('\n');
 }
 if(group==='info_menu'){
  return [
   'O que você gostaria de saber sobre a pousada?',
   '1 - Tarifas, planos e tipos de quartos',
   '2 - Café da manhã e Restaurante',
   '3 - Comodidades, Wi-Fi e estrutura',
   '4 - Localização e distância da Canção Nova',
   '0 - Voltar ao menu principal',
  ].join('\n');
 }
 return whatsappBotMenu();
}
export function whatsappSubmenuAnswer(group,optionNumber,{propertyName='Pousada Santa Terezinha do Menino Jesus',checkInTime='14:00',checkOutTime='12:00',baseUrl='https://gustavodihir.github.io/pousada-santa-terezinha-publicacao/'}={}){
 const site=new URL(baseUrl);
 if(group==='reservation_menu'){
  const footer='\n\nEscolha outra opção de Minha reserva (1 a 4) ou digite 0 para o menu principal.';
  switch(optionNumber){
   case 2:
    return [
     `🕒 Check-in, Check-out e Comprovante — ${propertyName}`,
     `• Check-in (entrada): a partir das ${checkInTime||'14:00'}.`,
     `• Check-out (saída): até as ${checkOutTime||'12:00'}.`,
     '• Após a confirmação da reserva pela pousada, acesse Minha conta no site para registrar o check-in e baixar o comprovante em PDF.',
    ].join('\n')+footer;
   case 3:
    return [
     `💳 Formas de Pagamento — ${propertyName}`,
     '• Aceitamos: Pix, Cartão de crédito, Cartão de débito, Dinheiro na pousada e Transferência bancária.',
     '• A modalidade escolhida no pedido passa pela conferência da pousada.',
     '• Segurança: nunca envie números de cartão ou senhas neste chat.',
    ].join('\n')+footer;
   case 4:
    return [
     `🔄 Alteração ou Cancelamento — ${propertyName}`,
     '• Você pode consultar e gerenciar sua reserva em Minha conta no site.',
     '• Para solicitar alteração de datas ou cancelamento com nossa equipe, volte ao menu (0) e escolha 4 (Falar com a pousada).',
    ].join('\n')+footer;
   default:
    return null;
  }
 }
 if(group==='info_menu'){
  const footer='\n\nEscolha outra informação (1 a 4) ou digite 0 para o menu principal.';
  switch(optionNumber){
   case 1:
    return [
     `📋 Tarifas, planos e tipos de quartos — ${propertyName}`,
     '• Quartos Privativos (valor por quarto/diária): Suíte Individual, Suíte Casal, Quarto Triplo e Quarto Família (a partir de R$ 180,00/diária).',
     '• Quartos Compartilhados (valor por vaga/diária): Acomodações de 4, 6, 8 e 12 vagas em beliches (a partir de R$ 75,00 por vaga/diária).',
     '• Planos com ou sem café da manhã conforme a acomodação.',
    ].join('\n')+footer;
   case 2:
    return [
     `☕ Café da manhã e Restaurante — ${propertyName}`,
     '• Contamos com restaurante próprio na pousada, com salão amplo, buffet variado, saladas e acompanhamentos.',
     '• Na reserva você pode escolher tarifas com café da manhã incluso quando disponível.',
    ].join('\n')+footer;
   case 3:
    return [
     `🛏️ Comodidades e Estrutura — ${propertyName}`,
     '• Suítes Privativas: Ar-condicionado, Wi-Fi gratuito, TV, frigobar, banheiro privativo, roupa de cama e banho.',
     '• Quartos Compartilhados: Ar-condicionado, Wi-Fi gratuito, beliches organizados por vaga e banheiro compartilhado.',
    ].join('\n')+footer;
   case 4:
    return [
     `📍 Localização — ${propertyName}`,
     '• Cachoeira Paulista – SP, em frente ao Santuário da Canção Nova (acesso a pé em poucos minutos).',
     `• Mapa e endereço no site: ${new URL('#localizacao',site).href}`,
    ].join('\n')+footer;
   default:
    return null;
  }
 }
 return null;
}
