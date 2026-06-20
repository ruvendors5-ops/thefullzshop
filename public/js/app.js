/* ════════════════════════════════════════════════
   The Fullz Shop v2 — Netlify Frontend
   ════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile Menu ──
  const menuBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  if (menuBtn && mainNav) {
    menuBtn.addEventListener('click', () => {
      mainNav.querySelector('.nav-list').classList.toggle('open');
    });
  }

  // ── FAQ Toggle ──
  window.toggleFAQ = function(el) {
    const item = el.parentElement;
    item.classList.toggle('open');
    const toggle = el.querySelector('.faq-toggle');
    if (toggle) toggle.textContent = item.classList.contains('open') ? '−' : '+';
  };

  // ── Policy Modal ──
  const policies = {
    refund: {
      title: 'Refund & Replacement Policy',
      body: `<h4>Dead Fullz / CCs</h4>
<p>If any fullz or CC data is invalid upon delivery, contact us within 48 hours with proof. We will issue a free replacement immediately.</p>
<h4>Transfer Services</h4>
<p>CashApp, Venmo, WU, Zelle, and PayPal transfers are processed within the stated timeframe. If a transfer fails due to our error, a full refund or re-attempt will be issued.</p>
<h4>Cloned Cards</h4>
<p>Physical cloned cards are covered by a replacement guarantee if they arrive damaged or do not function.</p>
<h4>No Chargebacks</h4>
<p>All sales are final. By purchasing, you agree that cryptocurrency payments are irreversible.</p>`
    },
    shipping: {
      title: 'Shipping & Delivery',
      body: `<h4>Digital Products</h4>
<p>Fullz, CCs, Bank Logs, and Dumps are delivered instantly via email upon payment confirmation.</p>
<h4>Transfer Services</h4>
<p>CashApp, Venmo, WU, Zelle, and PayPal transfers are processed within 2-24 hours.</p>
<h4>Cloned Cards (Physical)</h4>
<p>Express shipping worldwide: 3-7 business days. Tracking provided once available.</p>`
    },
    privacy: {
      title: 'Privacy & Security',
      body: `<h4>Data Collection</h4>
<p>We collect only the information needed to fulfill your order: an email address for delivery and any product-specific requirements.</p>
<h4>Encryption</h4>
<p>All connections to this site are encrypted via TLS.</p>
<h4>No Logs Policy</h4>
<p>We do not log any identifying information. After order delivery, your personal data is purged.</p>`
    },
    faq: {
      title: 'Frequently Asked Questions',
      body: `<h4>How do I place an order?</h4>
<p>Browse products, click "Buy Now", fill in your details, and you'll be redirected to our secure payment processor to complete with BTC or USDT.</p>
<h4>What payment methods do you accept?</h4>
<p>Bitcoin (BTC) and Tether USDT on TRC20 network.</p>
<h4>How long does delivery take?</h4>
<p>Digital products: instant. Transfer services: 2-24 hours. Cloned cards: 3-7 days.</p>
<h4>What if the data is invalid?</h4>
<p>Contact us within 48 hours with proof. Replacements issued free of charge.</p>
<h4>Do you offer bulk discounts?</h4>
<p>Yes. Contact @efullz on Telegram for bulk pricing.</p>`
    }
  };

  window.showPolicy = function(type) {
    const policy = policies[type];
    if (!policy) return;
    document.getElementById('policyTitle').textContent = policy.title;
    document.getElementById('policyBody').innerHTML = policy.body;
    document.getElementById('policyModal').classList.add('open');
  };

  window.closePolicy = function() {
    document.getElementById('policyModal').classList.remove('open');
  };

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // ── Checkout System ──
  let currentCheckout = { product: null, variant: null, price: 0 };

  // Render dynamic checkout fields based on product requirements
  function renderCheckoutFields(requirements) {
    const container = document.getElementById('checkoutFields');
    if (!requirements || requirements.length === 0) {
      requirements = [{ key: 'email', label: 'Email for Delivery', type: 'email', placeholder: 'your@email.com', required: true }];
    }
    
    let html = '';
    requirements.forEach((field, idx) => {
      const req = field.required ? 'required' : '';
      const reqStar = field.required ? '<span style="color:var(--danger);">*</span>' : '<span style="color:var(--text-dim);font-size:0.75rem;"> (optional)</span>';
      const id = `cf_${field.key}`;
      
      if (field.type === 'select') {
        html += `<div class="form-group">
          <label>${field.label} ${reqStar}</label>
          <select id="${id}" class="form-input" ${req}>
            <option value="">Select...</option>
            ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        </div>`;
      } else if (field.type === 'textarea') {
        html += `<div class="form-group">
          <label>${field.label} ${reqStar}</label>
          <textarea id="${id}" class="form-input" rows="3" placeholder="${field.placeholder || ''}" ${req}></textarea>
        </div>`;
      } else {
        html += `<div class="form-group">
          <label>${field.label} ${reqStar}</label>
          <input type="${field.type}" id="${id}" class="form-input" placeholder="${field.placeholder || ''}" ${req}>
        </div>`;
      }
    });
    
    // Add notes field
    html += `<div class="form-group" style="margin-top:0.5rem;">
      <label>Additional Notes <span style="color:var(--text-dim);font-size:0.75rem;"> (optional)</span></label>
      <textarea id="cf_notes" class="form-input" rows="2" placeholder="Any special requests or notes for this order"></textarea>
    </div>`;
    
    container.innerHTML = html;
  }

  // Collect dynamic field values
  function getCheckoutFields() {
    const fields = {};
    const reqs = window.productRequirements || [];
    reqs.forEach(field => {
      const el = document.getElementById(`cf_${field.key}`);
      if (el) fields[field.key] = el.value.trim();
    });
    fields.notes = document.getElementById('cf_notes') ? document.getElementById('cf_notes').value.trim() : '';
    return fields;
  }

  window.openCheckout = function(productId, variantLabel, price) {
    currentCheckout.product = productId;
    currentCheckout.variant = variantLabel;
    currentCheckout.price = price;
    
    document.getElementById('checkoutTitle').textContent = `Buy ${variantLabel}`;
    document.getElementById('checkoutTotal').textContent = `$${price}`;
    
    // Show summary
    document.getElementById('orderSummary').innerHTML = `
      <div class="os-row">
        <span class="os-label">Product</span>
        <span class="os-value">${variantLabel}</span>
      </div>
      <div class="os-row">
        <span class="os-label">Price</span>
        <span class="os-value">$${price}</span>
      </div>
      <div class="os-row">
        <span class="os-label">Quantity</span>
        <span class="os-value">1</span>
      </div>
      <div class="os-row" style="border-top:1px solid var(--border);margin-top:0.4rem;padding-top:0.8rem;font-weight:700;color:var(--gold);">
        <span class="os-label">Total</span>
        <span class="os-value">$${price}</span>
      </div>
    `;
    
    // Render dynamic fields
    renderCheckoutFields(window.productRequirements);
    
    // Reset to step 1
    document.querySelectorAll('.checkout-step').forEach(el => el.classList.remove('active'));
    document.getElementById('checkoutStep1').classList.add('active');
    
    document.getElementById('payBtn').disabled = false;
    document.getElementById('payBtn').innerHTML = `Proceed to Secure Checkout — <span>$${price}</span>`;
    
    document.getElementById('checkoutModal').classList.add('open');
  };

  window.closeCheckout = function() {
    document.getElementById('checkoutModal').classList.remove('open');
  };

  // Proceed to payment — creates order via Netlify Function, then redirects
  window.proceedToPayment = async function() {
    const fieldData = getCheckoutFields();
    const reqs = window.productRequirements || [];
    
    // Validate required fields
    for (const field of reqs) {
      if (field.required) {
        const val = fieldData[field.key];
        if (!val) {
          alert(`Please fill in "${field.label}" to proceed.`);
          return;
        }
      }
    }

    const btn = document.getElementById('payBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Creating Invoice...';

    try {
      const resp = await fetch('/.netlify/functions/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: currentCheckout.product,
          variantLabel: currentCheckout.variant,
          price: currentCheckout.price,
          fields: fieldData,
          details: fieldData.notes || ''
        })
      });

      const data = await resp.json();
      
      if (!data.success) {
        alert('Error: ' + (data.error || 'Failed to create order. Please try again or contact @efullz.'));
        btn.disabled = false;
        btn.textContent = `Proceed to Secure Checkout — $${currentCheckout.price}`;
        return;
      }

      // Show redirecting state
      document.querySelectorAll('.checkout-step').forEach(el => el.classList.remove('active'));
      document.getElementById('checkoutStep2').classList.add('active');
      
      // Set manual redirect link
      document.getElementById('manualRedirectLink').href = data.invoiceUrl;

      // Redirect to NowPayments checkout
      if (data.demo) {
        setTimeout(() => {
          window.location.href = data.invoiceUrl;
        }, 1500);
      } else {
        window.location.href = data.invoiceUrl;
      }

    } catch (err) {
      console.error('Checkout error:', err);
      alert('Connection error. Please try again or contact @efullz on Telegram.');
      btn.disabled = false;
      btn.textContent = `Proceed to Secure Checkout — $${currentCheckout.price}`;
    }
  };

  // ── Live Stats ──
  // Animate counters on page load
  function animateCounter(el) {
    if (!el) return;
    const target = parseInt(el.textContent.replace(/,/g, '')) || 0;
    let current = 0;
    const increment = Math.ceil(target / 30);
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { current = target; clearInterval(interval); }
      el.textContent = current.toLocaleString();
    }, 50);
  }

  setTimeout(() => {
    animateCounter(document.getElementById('orderCount'));
    animateCounter(document.getElementById('completedCount'));
    animateCounter(document.getElementById('heroOrders'));
  }, 300);

  // ── Realistic fluctuating stats ──
  // Orders completed ticker — increments 5-9 times per day simulation
  let baseCompleted = parseInt((document.getElementById('footerCompleted') || {}).textContent.replace(/,/g, '')) || 2212;
  setInterval(() => {
    // Simulate 5-9 orders completed per "day" — we do it every ~6-10 minutes
    // to make it look alive on the live site
    const bump = Math.floor(Math.random() * 5) + 5; // 5-9
    baseCompleted += bump;
    const els = [document.getElementById('footerCompleted'), document.getElementById('completedCount')];
    els.forEach(el => { if (el) el.textContent = baseCompleted.toLocaleString(); });
    // Also bump total orders
    const totalEls = [document.getElementById('footerOrders'), document.getElementById('orderCount'), document.getElementById('heroOrders')];
    totalEls.forEach(el => {
      if (el) {
        const cur = parseInt(el.textContent.replace(/,/g, '')) || baseCompleted;
        el.textContent = (cur + bump).toLocaleString();
      }
    });
  }, 420000 + Math.random() * 180000); // every 7-10 minutes

  // Active users — realistic fluctuation (higher during business hours simulation)
  setInterval(() => {
    const hour = new Date().getHours();
    let base = 8;
    if (hour >= 10 && hour <= 22) base = 12; // more users during day/evening
    if (hour >= 18 && hour <= 23) base = 16; // peak at night
    const active = Math.floor(Math.random() * 6) + base;
    const els = [document.getElementById('activeNow'), document.getElementById('footerActive')];
    els.forEach(el => { if (el) el.textContent = active; });
  }, 18000); // every 18 seconds

  console.log('%c💀 The Fullz Shop v2 — Netlify', 'font-size:20px; font-weight:bold; color:#ff0040;');
});
