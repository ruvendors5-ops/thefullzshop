// ── Check Payment Status — Netlify Function ──
// Polls NowPayments API for payment status by payment_id

const fetch = require('node-fetch');
const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY || '';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers };

  try {
    const { paymentId } = JSON.parse(event.body);
    
    if (!paymentId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing paymentId' }) };
    }

    // Demo mode — simulate payment after some time
    if (paymentId.startsWith('demo_')) {
      const createdAt = parseInt(paymentId.split('_')[1]) || Date.now();
      const elapsed = Date.now() - createdAt;
      const simulatedPaid = elapsed > 120000; // 2 minutes demo wait
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          payment_status: simulatedPaid ? 'finished' : 'waiting',
          paymentId,
          actually_paid: simulatedPaid ? 1 : 0
        })
      };
    }

    // Live mode — poll NowPayments
    const resp = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY
      }
    });

    const data = await resp.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        payment_status: data.payment_status || 'unknown',
        paymentId: data.payment_id,
        actually_paid: data.actually_paid || 0,
        pay_address: data.pay_address
      })
    };

  } catch (err) {
    console.error('[check-payment] Error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
