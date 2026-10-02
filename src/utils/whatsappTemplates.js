const BRAND_NAME = 'Mahalaxmi Krushi Prakriya Udyog';
const CONTACT = '7774982725 / 9168843668';
const SHOP_URL = 'https://mahalakshmi-foods.vercel.app';

function formatItems(items = []) {
  if (!items.length) return '  • (loading items...)';
  return items
    .map(
      (it) =>
        `  • ${it.products?.name || 'Product'} (${it.pack_size_kg || 1}kg) × ${it.quantity} = ₹${(it.price_at_time * it.quantity).toFixed(0)}`
    )
    .join('\n');
}

// 1️⃣ Enquiry received
export function msgOrderPlaced(order, items = []) {
  return `${BRAND_NAME}

Namaste *${order.customer_name}* ji,

We have received your wholesale order enquiry.

Order Code: *${order.order_code}*

Items:
${formatItems(items)}

Total: ₹${order.total_amount}

Our team will confirm your order shortly. Please wait for our confirmation message before transferring any payment.

Questions? Call us:
${CONTACT}`;
}

// 2️⃣ Order confirmed
export function msgOrderConfirmed(order) {
  return `${BRAND_NAME}

Hello *${order.customer_name}*,

Your order is *CONFIRMED*.

Order Code: *${order.order_code}*
Total: ₹${order.total_amount}
Payment Mode: ${order.payment_mode || 'Advance'}

We are now preparing your order. You will receive an update when it is packed and ready for dispatch.

${order.payment_mode !== 'Credit' ? `Please transfer ₹${order.total_amount} to our account if you haven't already:\nBank: ${order.bank_name || 'Mahalaxmi Krushi Prakriya Udyog'}\nWe will share bank details on request.\n` : ''}

${CONTACT}`;
}

// 3️⃣ Packed
export function msgOrderPacked(order, items = []) {
  return `${BRAND_NAME}

Hello *${order.customer_name}*,

Your wholesale order is *PACKED* and ready for dispatch.

Order Code: *${order.order_code}*

Items:
${formatItems(items)}

Total: ₹${order.total_amount}

We are arranging transport. You will receive LR details shortly.

${CONTACT}`;
}

// 4️⃣ Dispatched
export function msgDispatched(order) {
  return `${BRAND_NAME}

Hello *${order.customer_name}*,

Your order has been *DISPATCHED*.

Order Code: *${order.order_code}*
${order.transporter_name ? `Transporter: ${order.transporter_name}` : ''}
${order.transporter_lr ? `LR Number: ${order.transporter_lr}` : ''}
${order.package_count ? `Packages: ${order.package_count}` : ''}
${order.package_weight_kg ? `Total Weight: ${order.package_weight_kg} kg` : ''}
${order.estimated_delivery ? `Expected Delivery: ${order.estimated_delivery}` : ''}

Please track with the transporter using the LR number above.

For any issues, contact us:
${CONTACT}`;
}

// 5️⃣ Delivered
export function msgOrderDelivered(order) {
  return `${BRAND_NAME}

Hello *${order.customer_name}*,

Your order has been *DELIVERED*.

Order Code: *${order.order_code}*
Total: ₹${order.total_amount}

Thank you for your business. We hope the stock sells fast.

Reorder anytime at:
${SHOP_URL}

${CONTACT}`;
}

// 6️⃣ Cancelled
export function msgOrderCancelled(order) {
  return `${BRAND_NAME}

Hello *${order.customer_name}*,

Your order has been *CANCELLED*.

Order Code: *${order.order_code}*
Total: ₹${order.total_amount}

If this was not expected or you would like to reorder, please contact us immediately.

${CONTACT}`;
}

// ── Owner alert ──
export function msgOwnerNewOrder(order, items = []) {
  return `*NEW WHOLESALE ORDER*

Order Code: *${order.order_code}*
Retailer: ${order.customer_name}
Phone: ${order.customer_phone}
Address: ${order.customer_address}

Items:
${formatItems(items)}

Total: ₹${order.total_amount}
Payment: ${order.payment_mode || 'Advance'} · ${order.payment_status || 'Pending'}

Open Admin Panel: ${SHOP_URL}/admin/orders`;
}

export function getTemplateForStatus(status) {
  switch (status) {
    case 'Enquiry': return { fn: msgOrderPlaced, label: 'Enquiry Received' };
    case 'Confirmed': return { fn: msgOrderConfirmed, label: 'Order Confirmed' };
    case 'Packed': return { fn: msgOrderPacked, label: 'Order Packed' };
    case 'Dispatched': return { fn: msgDispatched, label: 'Dispatched' };
    case 'Delivered': return { fn: msgOrderDelivered, label: 'Delivered' };
    case 'Cancelled': return { fn: msgOrderCancelled, label: 'Cancelled' };
    default: return { fn: msgOrderConfirmed, label: 'Order Update' };
  }
}

export function normalizePhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  if (clean.length === 10) return `91${clean}`;
  if (clean.length === 12 && clean.startsWith('91')) return clean;
  return clean;
}

export function buildWhatsAppUrl(phone, message) {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function openWhatsApp(phone, message) {
  const url = buildWhatsAppUrl(phone, message);
  window.open(url, '_blank');
}