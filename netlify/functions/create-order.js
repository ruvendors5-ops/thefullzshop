// ── Create Order — Netlify Function ──
// Receives product details, creates NowPayments invoice, returns redirect URL

const fetch = require('node-fetch');

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const SITE_URL = process.env.URL || 'https://thefullz.shop';

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  try {
    const { product, variantLabel, price, fields, details } = JSON.parse(event.body);
    
    if (!product || !variantLabel || !price) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // Generate order ID
    const orderId = 'TFS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    
    // Store order data in response (for stateless tracking)
    const orderData = {
      id: orderId,
      product,
      variant: variantLabel,
      totalUSD: price,
      fields: fields || {},
      details: details || '',
      status: 'pending',
      createdAt: Date.now()
    };

    // Create NowPayments invoice (or use demo mode)
    let invoiceUrl = null;
    let paymentId = null;

    if (NOWPAYMENTS_API_KEY) {
      const resp = await fetch('https://api.nowpayments.io/v1/invoice', {
        method: 'POST',
        headers: {
          'x-api-key': NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          price_amount: price,
          price_currency: 'usd',
          pay_currency: 'btc',
          order_id: orderId,
          order_description: `${product} - ${variantLabel} | ${fields && fields.email ? fields.email : 'BTC order'}`,
          ipn_callback_url: `${SITE_URL}/.netlify/functions/payment-callback`,
          success_url: `${SITE_URL}/order/?id=${orderId}`,
          cancel_url: `${SITE_URL}/order/?id=${orderId}&status=cancel`,
          is_fixed_rate: true,
          is_fee_paid_by_user: true
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error('[NowPayments] Invoice error:', data);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment provider error' }) };
      }

      invoiceUrl = data.invoice_url;
      paymentId = data.id;
    } else {
      // Demo mode — simulate invoice URL
      invoiceUrl = `${SITE_URL}/order/?id=${orderId}&status=success`;
      paymentId = 'demo_' + orderId;
    }

    // Update order with payment info
    orderData.paymentId = paymentId;
    orderData.status = 'awaiting';

    // Return order + redirect URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId,
        invoiceUrl,
        totalUSD: price,
        demo: !NOWPAYMENTS_API_KEY
      })
    };

  } catch (err) {
    console.error('[create-order] Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
