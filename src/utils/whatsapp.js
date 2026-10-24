import { formatINR, parsePrice } from './price';

export function normalizeWhatsAppNumber(value = '') {
  return String(value).replace(/\D/g, '');
}

export function buildWhatsAppUrl(number, message) {
  const digits = normalizeWhatsAppNumber(number);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage(cart, info) {
  const lines = cart.map((item) => {
    const amount = parsePrice(item.price) * item.quantity;
    return `• ${item.quantity} × ${item.name}${item.portion ? ` (${item.portion})` : ''} — ${formatINR(amount)}`;
  });
  const total = cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);

  return [
    `Hello ${info.name}! I'd like to place a takeaway order.`,
    '',
    ...lines,
    '',
    `Total: ${formatINR(total)}`,
    '',
    'Name:',
    'Pickup time:',
    'Notes (spice level, extra chutney, etc.):',
  ].join('\n');
}

export function buildCheckoutMessage(
  {
    cart,
    customer,
    orderType,
    notes,
    deliveryZone,
    deliveryFee = 0,
    discount = 0,
    total: providedTotal,
    scheduledFor,
    prepMinutes,
    paymentMethod,
  },
  info,
) {
  const lines = cart.map((item) => {
    const amount = parsePrice(item.price) * item.quantity;
    return `• ${item.quantity} × ${item.name}${item.portion ? ` (${item.portion})` : ''} — ${formatINR(amount)}`;
  });
  const subtotal = cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
  const total = Number.isFinite(Number(providedTotal)) ? Number(providedTotal) : subtotal;
  const deliveryLine =
    orderType === 'delivery'
      ? `Delivery address: ${customer.address || '—'}${deliveryZone ? ` (${deliveryZone})` : ''}`
      : 'Pickup from College Square, Belonia';
  const timingLine = scheduledFor
    ? `Scheduled for: ${new Date(scheduledFor).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      })}`
    : prepMinutes
      ? `Preparation time: about ${prepMinutes} minutes`
      : '';

  return [
    `🛎️ NEW ORDER — ${info.name}`,
    '',
    `Name: ${customer.name || '—'}`,
    `Phone: ${customer.phone ? `+91 ${customer.phone}` : '—'}`,
    deliveryLine,
    timingLine,
    paymentMethod === 'upi' ? 'Payment: UPI (verify before handover)' : 'Payment: pay at pickup / delivery',
    '',
    ...lines,
    '',
    `Subtotal: ${formatINR(subtotal)}`,
    deliveryFee > 0 ? `Delivery fee: ${formatINR(deliveryFee)}` : '',
    discount > 0 ? `Loyalty reward: −${formatINR(discount)}` : '',
    `Total: ${formatINR(total)}`,
    notes ? `Notes: ${notes}` : '',
    '',
    'Please confirm my order on WhatsApp.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildReservationMessage({ name, phone, date, time, guests, notes }, info) {
  return [
    `Hello ${info.name}! I'd like to reserve a table.`,
    '',
    `Name: ${name || '—'}`,
    `Phone: ${phone || '—'}`,
    `Date: ${date || '—'}`,
    `Time: ${time || '—'}`,
    `Guests: ${guests || '—'}`,
    notes ? `Notes: ${notes}` : '',
    '',
    'Please confirm availability. Thank you!',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildContactMessage({ name, phone, email, subject, message }, info) {
  return [
    `Hello ${info.name}!`,
    '',
    `Name: ${name || '—'}`,
    `Phone: ${phone || '—'}`,
    email ? `Email: ${email}` : '',
    subject ? `Topic: ${subject}` : '',
    '',
    message || '',
  ]
    .filter(Boolean)
    .join('\n');
}
