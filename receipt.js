import { degrees, PDFDocument, ParseSpeeds, rgb, StandardFonts } from './pdf-lib.js?v=d5e45c13';

const attachmentBytes = 2 * 1024 * 1024;
const storedAttachmentBytes = attachmentBytes + 64 * 1024;
const receiptBytes = 8 * 1024 * 1024;
const maxAppendixPages = 15;
const maxAttachments = 3;
const unknown = 'Não registrado';
const date = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric',
});
const timestamp = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const ink = rgb(.08, .16, .25);
const blue = rgb(.02, .31, .56);
const gray = rgb(.29, .35, .40);
const pale = rgb(.93, .96, .99);
const line = rgb(.82, .88, .94);
const white = rgb(1, 1, 1);

function formatDate(format, value) {
  if (value == null) return unknown;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? format.format(parsed) : unknown;
}

function toFontText(value, supported) {
  const clean = String(value || unknown).normalize('NFC').replace(/\s+/gu, ' ').trim() || unknown;
  return Array.from(clean, char => {
    if (supported.has(char.codePointAt(0))) return char;
    const fallback = char.normalize('NFKD').replace(/\p{M}/gu, '');
    return fallback && Array.from(fallback).every(part => supported.has(part.codePointAt(0))) ? fallback : '?';
  }).join('');
}

function fit(font, value, size, width, minimum = 8) {
  while (size > minimum && font.widthOfTextAtSize(value, size) > width) size -= .5;
  if (font.widthOfTextAtSize(value, size) <= width) return { value, size };
  const suffix = '…';
  const points = Array.from(value);
  while (points.length && font.widthOfTextAtSize(points.join('') + suffix, size) > width) points.pop();
  return { value: points.join('') + suffix, size };
}

async function drawCover(pdf, data, appendixPages) {
  const normal = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const supported = new Set(normal.getCharacterSet());
  const width = 595.28;
  const height = 841.89;
  const margin = 42;
  const usable = width - margin * 2;
  const page = pdf.addPage([width, height]);
  const text = (value, x, y, options = {}) => {
    const { font = normal, size = 11, color = ink, max = usable, minimum } = options;
    const fitted = fit(font, toFontText(value, supported), size, max, minimum);
    page.drawText(fitted.value, { x, y, font, size: fitted.size, color });
  };
  const horizontal = y => page.drawLine({
    start: { x: margin, y }, end: { x: width - margin, y }, thickness: .65, color: line,
  });
  const group = (value, y) => {
    text(value, margin, y, { font: bold, color: blue, size: 11 });
    horizontal(y - 9);
  };
  const field = (label, value, y, column = 0, full = false) => {
    const x = margin + column * (usable / 2 + 7);
    const max = full ? usable : usable / 2 - 9;
    text(label, x, y, { color: gray, size: 9.5, max });
    text(value, x, y - 17, { font: bold, size: 12, max });
  };

  page.drawRectangle({ x: 0, y: height - 144, width, height: 144, color: blue });
  let hasLogo = false;
  if (data.property?.logo) {
    try {
      const bytes = Uint8Array.from(atob(data.property.logo.split(',')[1]), char => char.charCodeAt(0));
      const logo = data.property.logo.startsWith('data:image/png;') ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
      const scale = Math.min(60 / logo.width, 36 / logo.height);
      page.drawImage(logo, { x: width - margin - logo.width * scale, y: height - 58 + (36 - logo.height * scale) / 2, width: logo.width * scale, height: logo.height * scale });
      hasLogo = true;
    } catch { /* A identificação textual continua disponível se a imagem estiver corrompida. */ }
  }
  text(data.property?.name || 'HOSPEDAGEM', margin, height - 48, { font: bold, color: white, size: 11, max: usable - (hasLogo ? 75 : 0) });
  text('Comprovante de reserva e compra', margin, height - 90, { font: bold, color: white, size: 25 });
  text(data.approval === 'pending' ? 'PRÉVIA · Reserva aguardando aprovação' : 'Reserva de demonstração confirmada', margin, height - 115, { color: white, size: 10 });
  page.drawRectangle({ x: margin, y: 611, width: usable, height: 61, color: pale });
  text('NÚMERO DA COMPRA', margin + 13, 650, { color: gray, size: 9, max: usable / 2 - 22 });
  text(data.purchaseNumber, margin + 13, 627, { font: bold, size: 15, max: usable / 2 - 22 });
  text('REGISTRO DO CHECK-IN', margin + usable / 2 + 10, 650, { color: gray, size: 9, max: usable / 2 - 22 });
  text(data.checkInNumber || 'Ainda não realizado', margin + usable / 2 + 10, 627, { font: bold, size: 15, max: usable / 2 - 22 });

  group('Hóspede e registro', 580);
  text('Nome completo', margin, 550, { color: gray, size: 9.5 });
  const fullName = toFontText(data.name, supported);
  if (bold.widthOfTextAtSize(fullName, 12) <= usable) {
    text(fullName, margin, 533, { font: bold, size: 12 });
  } else {
    const characters = Array.from(fullName);
    let split = 0;
    while (split < characters.length && bold.widthOfTextAtSize(characters.slice(0, split + 1).join(''), 9.5) <= usable) split++;
    text(characters.slice(0, split).join(''), margin, 533, { font: bold, size: 9.5 });
    text(characters.slice(split).join(''), margin, 520, { font: bold, size: 9.5 });
  }
  field('Data e hora da confirmação', formatDate(timestamp, data.confirmedAt), 500);
  field('Data e hora do check-in', formatDate(timestamp, data.checkedInAt), 500, 1);
  field('Código da reserva', data.code, 455);

  group('Estadia e pagamento', 410);
  const offer = data.offer ?? {};
  field('Acomodação', offer.name, 380, 0, true);
  field('Entrada prevista', formatDate(date, offer.arrival) + (data.property?.checkInTime ? ' · '+data.property.checkInTime : ''), 335);
  field('Saída prevista', formatDate(date, offer.departure) + (data.property?.checkOutTime ? ' · '+data.property.checkOutTime : ''), 335, 1);
  const guests = Number.isInteger(offer.adults) && Number.isInteger(offer.children)
    ? `${offer.adults} adulto${offer.adults === 1 ? '' : 's'} e ${offer.children} criança${offer.children === 1 ? '' : 's'}`
    : unknown;
  field('Hóspedes', guests, 290);
  field('Plano contratado', offer.planName || (offer.breakfast ? 'Com café da manhã' : 'Hospedagem'), 290, 1);
  field('Forma de pagamento informada', data.paymentMethod, 245);
  field('Total da reserva', Number.isFinite(offer.total) ? money.format(offer.total / 100) : unknown, 245, 1);
  text(offer.priceUnit === 'guest' ? (offer.adults + offer.children) + ' vagas x ' + offer.nights + ' noites = ' + ((offer.adults + offer.children) * offer.nights) + ' diárias unitárias. Sem cobrança neste ambiente.' : 'Sem cobrança neste ambiente.', margin, 200, { color: gray, size: 10 });

  group('Dados da pousada', 164);
  const property = data.property || {};
  const cnpjText = property.taxId ? (/cnpj/i.test(property.taxId) ? property.taxId : `CNPJ: ${property.taxId}`) : '';
  text([property.legalName || property.name, cnpjText].filter(Boolean).join(' · ') || 'Identificação a preencher pela pousada.', margin, 140, { color: gray, size:9 });
  text([property.address, property.city].filter(Boolean).join(' · '), margin, 122, { color: gray, size:9 });
  const phoneDigits = (property.phone || '').replace(/\D/g, '');
  const whatsappDigits = (property.whatsapp || '').replace(/\D/g, '');
  const samePhone = phoneDigits && whatsappDigits && (phoneDigits === whatsappDigits || whatsappDigits.endsWith(phoneDigits) || phoneDigits.endsWith(whatsappDigits));
  const phoneLabel = samePhone
    ? `Telefone / WhatsApp: ${property.phone}`
    : [property.phone ? `Telefone: ${property.phone}` : '', property.whatsapp ? `WhatsApp: ${property.whatsapp}` : ''].filter(Boolean).join(' · ');
  text([phoneLabel, property.email].filter(Boolean).join(' · '), margin, 104, { color: gray, size:9 });
  horizontal(85);
  text(appendixPages ? `Documentos anexados: ${appendixPages} página${appendixPages === 1 ? '' : 's'} a seguir.`
    : 'Nenhum documento anexado.', margin, 62, { color: gray, size: 9.5 });
  text('Horários no fuso de Brasília.', margin, 43, { color: gray, size: 9.5 });
}

async function loadAttachment(bytes, limit) {
  if (!(bytes instanceof Uint8Array) || bytes.length > limit || bytes.length < 5 ||
      String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('Envie um documento PDF válido de até 2 MB.');
  }
  const document = await PDFDocument.load(bytes, {
    ignoreEncryption: false, updateMetadata: false,
    parseSpeed: ParseSpeeds.Fast, throwOnInvalidObject: true,
  });
  const pages = document.getPages();
  if (!pages.length || pages.length > maxAppendixPages) throw new Error('O documento deve ter entre 1 e 15 páginas.');
  return pages;
}

async function appendStaticPage(pdf, original) {
  const { x, y, width, height } = original.getCropBox();
  const rotation = ((original.getRotation().angle % 360) + 360) % 360;
  if (![x, y, width, height].every(Number.isFinite) || width < 1 || height < 1 ||
      width > 2880 || height > 2880 || Math.abs(x) > 2880 || Math.abs(y) > 2880 ||
      ![0, 90, 180, 270].includes(rotation)) {
    throw new Error('O documento contém uma página em formato incompatível.');
  }
  const turned = rotation === 90 || rotation === 270;
  const target = pdf.addPage(turned ? [height, width] : [width, height]);
  if (!original.node.Contents()) return;
  const content = await pdf.embedPage(original, { left: x, bottom: y, right: x + width, top: y + height });
  // Import the visible content as a Form XObject, leaving page annotations and catalog actions behind.
  target.drawPage(content, {
    x: rotation === 180 ? width : rotation === 270 ? height : 0,
    y: rotation === 90 ? width : rotation === 180 ? height : 0,
    rotate: degrees(-rotation),
  });
}

export async function sanitizeAttachment(bytes) {
  const pages = await loadAttachment(bytes, attachmentBytes);
  const clean = await PDFDocument.create();
  for (const page of pages) await appendStaticPage(clean, page);
  const output = await clean.save();
  if (output.length > storedAttachmentBytes) throw new Error('O documento convertido ficou grande demais.');
  return { pdf: output, pages: pages.length };
}

export async function makeReceipt(data, attachments = []) {
  if (attachments.length > maxAttachments) throw new Error('Anexe no máximo três documentos.');
  const groups = [];
  let pageCount = 0;
  for (const attachment of attachments) {
    const pages = await loadAttachment(attachment, storedAttachmentBytes);
    pageCount += pages.length;
    if (pageCount > maxAppendixPages) throw new Error('Os documentos anexados devem ter até 15 páginas no total.');
    groups.push(pages);
  }
  const pdf = await PDFDocument.create();
  pdf.setTitle('Comprovante de reserva e compra');
  await drawCover(pdf, data, pageCount);
  for (const pages of groups) {
    for (const page of pages) await appendStaticPage(pdf, page);
  }
  const output = await pdf.save();
  if (output.length > receiptBytes) throw new Error('O comprovante com anexos ficou grande demais.');
  return output;
}
