// NowPayments.io integration — BTC & TRC20 USDT
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

const API_KEY = process.env.NOWPAYMENTS_API_KEY || '';
const API_URL = 'https://api.nowpayments.io/v1';

// Headers for all API calls
function headers() {
  return {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  };
}

// Create a payment invoice for an order
async function createPayment(amountUSD, orderId, customerEmail) {
  if (!API_KEY) {
    // Demo mode — return fake payment data
    return {
      success: true,
      payment_id: 'demo_' + uuidv4().slice(0, 8),
      payment_address: 'bc1qdemo0000000000000000000000000000000000',
      pay_amount: amountUSD,
      pay_currency: 'btc',
      price_amount: amountUSD,
      price_currency: 'usd',
      invoice_url: '#',
      demo: true
    };
  }

  try {
    const resp = await fetch(`${API_URL}/invoice`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        price_amount: amountUSD,
        price_currency: 'usd',
        pay_currency: 'btc',     // Will also accept USDT TRC20
        ipn_callback_url: `https://thefullz.shop/api/payment-callback`,
        order_id: orderId,
        order_description: `Order ${orderId}`,
        is_fixed_rate: true,
        is_fee_paid_by_user: true,
        payout_address: process.env.BTC_PAYOUT_ADDRESS || '',
        payout_currency: 'btc'
      })
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('[NowPayments] Error:', data);
      return { success: false, error: data.message || 'Payment creation failed' };
    }

    return {
      success: true,
      payment_id: data.id,
      payment_address: data.pay_address,
      pay_amount: data.pay_amount,
      pay_currency: data.pay_currency,
      price_amount: data.price_amount,
      price_currency: data.price_currency,
      invoice_url: data.invoice_url,
      demo: false
    };
  } catch (err) {
    console.error('[NowPayments] Exception:', err.message);
    return { success: false, error: err.message };
  }
}

// Check payment status
async function checkPayment(paymentId) {
  if (!API_KEY || paymentId.startsWith('demo_')) {
    // Demo mode — simulate payment after 30 seconds
    return { status: 'waiting' };
  }

  try {
    const resp = await fetch(`${API_URL}/payment/${paymentId}`, {
      headers: headers()
    });
    const data = await resp.json();
    return {
      status: data.payment_status || 'waiting',  // waiting, confirming, confirmed, finished, failed
      actually_paid: data.actually_paid,
      pay_amount: data.pay_amount
    };
  } catch (err) {
    return { status: 'waiting' };
  }
}

// Get estimated price (for live conversion display)
async function getEstimate(amountUSD, currency = 'btc') {
  try {
    if (!API_KEY) {
      // Mock conversion
      const rates = { btc: 0.000015, usdttrc20: 1.0 };
      return { amount: (amountUSD * (rates[currency] || 0.000015)).toFixed(8), currency };
    }
    const resp = await fetch(
      `${API_URL}/estimate?amount=${amountUSD}&currency_from=usd&currency_to=${currency}`,
      { headers: headers() }
    );
    const data = await resp.json();
    return { amount: data.estimated_amount, currency };
  } catch {
    return { amount: '0.00', currency };
  }
}

module.exports = { createPayment, checkPayment, getEstimate };
