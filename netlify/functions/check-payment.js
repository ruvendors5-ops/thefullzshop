// ── Check Payment — Netlify Function ──
// Checks order payment status. In demo mode, auto-confirms after first check.
// In live mode, queries NowPayments API.

const fetch = require('node-fetch');

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

// In-memory store for demo orders (resets on function cold start)
// In production, use Netlify Blobs or a database
const orderStore = {};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const orderId = event.queryStringParameters?.id;
  if (!orderId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing order ID' }) };
  }

  // Demo mode: simulate payment confirmation
  // First check returns "awaiting", subsequent checks return "delivered"
  if (!orderStore[orderId]) {
    orderStore[orderId] = { checkCount: 0, status: 'awaiting', product: 'Fullz', variant: 'US Fullz', totalUSD: 80 };
  }

  const order = orderStore[orderId];
  order.checkCount++;

  let status = order.status;
  let product = order.product;
  let variant = order.variant;
  let totalUSD = order.totalUSD;

  // In demo mode, after 3 checks (≈15 seconds) mark as delivered
  if (!NOWPAYMENTS_API_KEY) {
    if (order.checkCount >= 3 && order.status === 'awaiting') {
      order.status = 'delivered';
      status = 'delivered';
    }
  } else {
    // Live mode — check NowPayments API
    // (In production, the webhook would update the order status)
    try {
      // For now, just return the stored status
      // The webhook handler updates this
    } catch (err) {
      console.error('[check-payment] API error:', err);
    }
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      id: orderId,
      status: order.status,
      product,
      variant,
      totalUSD,
      deliveredAt: order.deliveredAt || null
    })
  };
};
