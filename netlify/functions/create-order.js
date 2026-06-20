// ── Create Order — Netlify Function ──
// Creates a NowPayments payment, returns BTC address + amount to display
// Updates: uses Create Payment (not Invoice) for inline BTC address display

const fetch = require('node-fetch');

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const SITE_URL = process.env.URL || 'https://thefullz.shop';

exports.handler = async (event) => {
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

    const orderId = 'TFS-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    if (NOWPAYMENTS_API_KEY) {
      // ── LIVE MODE: Create NowPayments Payment ──
      const resp = await fetch('https://api.nowpayments.io/v1/payment', {
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
          order_description: `${product} - ${variantLabel}`,
          ipn_callback_url: `${SITE_URL}/.netlify/functions/payment-callback`,
          is_fixed_rate: true,
          is_fee_paid_by_user: true
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error('[NowPayments] Payment error:', JSON.stringify(data));
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Payment provider error' }) };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          orderId,
          paymentId: data.payment_id,
          payAddress: data.pay_address,
          payAmount: data.pay_amount,
          payCurrency: 'BTC',
          priceAmount: price,
          priceCurrency: 'USD',
          demo: false
        })
      };
    } else {
      // ── DEMO MODE: Fake BTC address for testing ──
      const demoAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2'
      ];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          orderId,
          paymentId: 'demo_' + orderId,
          payAddress: demoAddresses[Math.floor(Math.random() * demoAddresses.length)],
          payAmount: (price / 95000).toFixed(8), // ~$95k BTC rate
          payCurrency: 'BTC',
          priceAmount: price,
          priceCurrency: 'USD',
          demo: true
        })
      };
    }

  } catch (err) {
    console.error('[create-order] Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
