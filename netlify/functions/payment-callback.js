// ── Payment Callback — Netlify Function ──
// Receives NowPayments IPN (Instant Payment Notification) webhook
// Marks order as delivered when payment is confirmed

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    console.log('[payment-callback] Received:', JSON.stringify(data));

    const { payment_status, order_id, actually_paid } = data;

    if (payment_status === 'finished' || payment_status === 'confirmed') {
      console.log(`[✓] Order ${order_id} — PAID ($${actually_paid})`);
      
      // In production: update order status in database
      // For now, log it — admin can see in NowPayments dashboard
      
      // TODO: Send delivery email via SendGrid/Resend
      // TODO: Update order status in persistent store
    }

    // Always respond 200 to acknowledge receipt
    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('[payment-callback] Error:', err);
    return { statusCode: 200, body: 'OK' }; // Acknowledge even on error
  }
};
