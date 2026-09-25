// ============================================
// WhatsApp Message Templates
// 6 scenarios — customer-facing + owner-facing
// ============================================

const BRAND_NAME = 'Mahalaxmi Krushi Prakriya Udyog';
const CONTACT = '7774982725 / 9168843668';
const SHOP_URL = 'https://mahalakshmi-foods.vercel.app'; // update after deploy
const TRACK_URL = `${SHOP_URL}/track`;

function formatItems(items = []) {
  if (!items.length) return '  • (loading items...)';
  return items
    .map(
      (it) =>
        `  • ${it.products?.name || 'Product'} (${it.products?.weight || ''}) × ${it.quantity} — ₹${it.price_at_time}`
    )
    .join('\n');
}

// ---------- CUSTOMER MESSAGES ----------

// 1️⃣ Order Placed — confirmation to customer
export function msgOrderPlaced(order, items = []) {
  return `🌿 *${BRAND_NAME}*

Namaste *${order.customer_name}* ji! 🙏

Your order has been received successfully ✅

📋 Order Code: *${order.order_code}*
📦 Items:
${formatItems(items)}
💰 Total: ₹${order.total_amount}
📍 Delivery to: ${order.customer_address}

We'll confirm your order shortly and keep you updated at every step.

For any queries, call us:
📞 ${CONTACT}

Thank you for choosing us! 🌿`;
}

// 2️⃣ Order Confirmed
export function msgOrderConfirmed(order) {
  return `🌿 *${BRAND_NAME}*

Good news *${order.customer_name}* ji! ✅

Your order is *CONFIRMED*.

📋 Order Code: *${order.order_code}*
💰 Total: ₹${order.total_amount}

We're now preparing your fresh chips. They'll be packed and ready very soon. 🌿

🔍 Track anytime: ${TRACK_URL}

📞 ${CONTACT}`;
}

// 3️⃣ Packed & Ready
export function msgOrderPacked(order, items = []) {
  return `🌿 *${BRAND_NAME}*

*${order.customer_name}* ji, your order is *PACKED*! 📦

📋 Order Code: *${order.order_code}*
📦 Items:
${formatItems(items)}

Everything is freshly sealed and ready. We'll hand it over to delivery soon. 🚚

📍 Delivery to: ${order.customer_address}

📞 ${CONTACT}`;
}

// 4️⃣ Out for Delivery
export function msgOutForDelivery(order) {
  return `🌿 *${BRAND_NAME}*

*${order.customer_name}* ji, your order is *OUT FOR DELIVERY*! 🚚

📋 Order Code: *${order.order_code}*
💰 Total: ₹${order.total_amount} (Cash on Delivery)

Our delivery partner will reach you shortly. Please keep your phone nearby. 📱

📍 ${order.customer_address}

📞 ${CONTACT}`;
}

// 5️⃣ Delivered
export function msgOrderDelivered(order) {
  return `🌿 *${BRAND_NAME}*

*${order.customer_name}* ji, your order has been *DELIVERED* ✅

📋 Order Code: *${order.order_code}*
💰 Total: ₹${order.total_amount}

We hope you enjoy your chips! 🌿

If you loved them, please leave us a review — it means a lot to our small family business. ⭐

🔁 Want to reorder? Visit our store:
${SHOP_URL}

📞 ${CONTACT}`;
}

// 6️⃣ Cancelled
export function msgOrderCancelled(order) {
  return `🌿 *${BRAND_NAME}*

*${order.customer_name}* ji, your order has been *CANCELLED*.

📋 Order Code: *${order.order_code}*
💰 Total: ₹${order.total_amount}

We're sorry for any inconvenience. If this was a mistake or you'd like to reorder, please reply to this message or call us.

📞 ${CONTACT}`;
}

// ---------- OWNER MESSAGE (notify owner of new order) ----------

export function msgOwnerNewOrder(order, items = []) {
  return `🔔 *NEW ORDER RECEIVED*

📋 Order Code: *${order.order_code}*
👤 Customer: ${order.customer_name}
📞 Phone: ${order.customer_phone}
📍 Address: ${order.customer_address}

📦 Items:
${formatItems(items)}

💰 Total: ₹${order.total_amount}
💳 Payment: Cash on Delivery
🕒 Status: ${order.status}

Open Admin Panel to manage → ${SHOP_URL}/admin/orders`;
}

// ---------- HELPERS ----------

// Pick the right template for the current order status
export function getTemplateForStatus(status) {
  switch (status) {
    case 'Pending': return { fn: msgOrderPlaced, label: 'Order Placed' };
    case 'Confirmed': return { fn: msgOrderConfirmed, label: 'Order Confirmed' };
    case 'Packed': return { fn: msgOrderPacked, label: 'Order Packed' };
    case 'Out for Delivery': return { fn: msgOutForDelivery, label: 'Out for Delivery' };
    case 'Delivered': return { fn: msgOrderDelivered, label: 'Order Delivered' };
    case 'Cancelled': return { fn: msgOrderCancelled, label: 'Order Cancelled' };
    default: return { fn: msgOrderConfirmed, label: 'Order Update' };
  }
}

// Normalize phone → international format for wa.me
export function normalizePhone(phone) {
  const clean = String(phone || '').replace(/\D/g, '');
  // Indian numbers: add 91 prefix if 10 digits
  if (clean.length === 10) return `91${clean}`;
  if (clean.length === 12 && clean.startsWith('91')) return clean;
  return clean;
}

// Build the wa.me URL (opens WhatsApp with the message pre-filled)
export function buildWhatsAppUrl(phone, message) {
  const number = normalizePhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// Open WhatsApp in a new tab
export function openWhatsApp(phone, message) {
  const url = buildWhatsAppUrl(phone, message);
  window.open(url, '_blank');
}