/**
 * CHECKOUT PAGE LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {
  const cart = CartStore.get();
  if (cart.length === 0) {
    showToast('Your cart is empty! Redirecting to products...', 'info');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
    return;
  }

  populateCheckoutFormFromProfile();
  renderCheckoutSummary();
  setupPaymentMethodToggles();
  setupCheckoutForm();
});

// Auto populate form from saved user profile
function populateCheckoutFormFromProfile() {
  const profile = UserProfileStore.get();
  if (!profile) return;

  const nameEl = document.getElementById('customer-name');
  const phoneEl = document.getElementById('customer-phone');
  const emailEl = document.getElementById('customer-email');
  const addressEl = document.getElementById('customer-address');

  if (nameEl && !nameEl.value) nameEl.value = profile.full_name || '';
  if (phoneEl && !phoneEl.value) phoneEl.value = profile.phone || '';
  if (emailEl && !emailEl.value) emailEl.value = profile.email || '';
  if (addressEl && !addressEl.value) {
    const fullAddr = profile.city ? `${profile.address}, ${profile.city}` : profile.address;
    addressEl.value = fullAddr || '';
  }
}

// Render sidebar order items and totals
function renderCheckoutSummary() {
  const cart = CartStore.get();
  const listContainer = document.getElementById('checkout-items-list');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const shippingEl = document.getElementById('checkout-shipping');
  const totalEl = document.getElementById('checkout-total');

  if (listContainer) {
    listContainer.innerHTML = '';
    cart.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'flex items-center justify-between text-xs py-2';
      itemEl.innerHTML = `
        <div class="flex items-center gap-2.5 flex-1 pr-2">
          <img
            src="${item.image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'}"
            alt="${item.name}"
            class="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
          />
          <div class="truncate">
            <p class="font-bold text-slate-800 truncate">${item.name}</p>
            <p class="text-slate-400">Qty: ${item.quantity} × ${formatCurrency(item.price)}</p>
          </div>
        </div>
        <span class="font-extrabold text-slate-900 shrink-0">${formatCurrency(item.price * item.quantity)}</span>
      `;
      listContainer.appendChild(itemEl);
    });
  }

  const { subtotal, shipping, total } = CartStore.getTotals();
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (shippingEl) shippingEl.textContent = formatCurrency(shipping);
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

// Payment Option Card radio toggles
function setupPaymentMethodToggles() {
  const optionCards = document.querySelectorAll('.payment-option-card');
  const demoCardBox = document.getElementById('demo-card-box');
  const demoBankBox = document.getElementById('demo-bank-box');

  optionCards.forEach(card => {
    const radio = card.querySelector('input[type="radio"]');

    card.addEventListener('click', () => {
      optionCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      if (radio) radio.checked = true;

      const selectedValue = radio ? radio.value : '';
      if (demoCardBox) {
        if (selectedValue === 'Online Payment (BKash, Nagad)') demoCardBox.classList.remove('hidden');
        else demoCardBox.classList.add('hidden');
      }
      if (demoBankBox) {
        if (selectedValue === 'Bank Payment (demo)') demoBankBox.classList.remove('hidden');
        else demoBankBox.classList.add('hidden');
      }
    });
  });
}

// Handle Form Submission and Order Creation
function setupCheckoutForm() {
  const form = document.getElementById('checkout-form');
  const placeOrderBtn = document.getElementById('place-order-btn');
  const spinner = document.getElementById('place-order-spinner');
  const btnText = document.getElementById('place-order-text');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // MANDATORY REQUIREMENT: User profile must exist before placing an order
    if (!UserProfileStore.isComplete()) {
      showToast('User profile required! Please complete your profile first.', 'error');
      openUserProfileModal(true);
      return;
    }

    const name = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    
    const selectedPaymentRadio = document.querySelector('input[name="payment_method"]:checked');
    const paymentMethod = selectedPaymentRadio ? selectedPaymentRadio.value : 'Cash on Delivery';

    if (!name || !phone || !email || !address) {
      showToast('Please complete all required customer fields.', 'error');
      return;
    }

    // Save/update profile automatically
    UserProfileStore.save({
      full_name: name,
      phone: phone,
      email: email,
      address: address
    });

    const cart = CartStore.get();
    if (cart.length === 0) {
      showToast('Your cart is empty!', 'error');
      return;
    }

    // UI Loading state
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    if (spinner) spinner.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Verifying Stock & Processing...';

    const orderData = {
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      shipping_address: address,
      payment_method: paymentMethod,
      items: cart
    };

    try {
      // Call atomic backend / database order function
      const result = await dbCreateOrder(orderData);

      if (result.success) {
        showToast('Order created successfully!', 'success');
        CartStore.clear(); // Clear cart after successful checkout

        setTimeout(() => {
          window.location.href = `order-success.html?orderId=${encodeURIComponent(result.order_id)}`;
        }, 800);
      } else {
        showToast(result.error || 'Failed to create order due to stock constraints.', 'error');
        resetButtonState();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      showToast('An unexpected error occurred. Please try again.', 'error');
      resetButtonState();
    }
  });

  function resetButtonState() {
    if (placeOrderBtn) placeOrderBtn.disabled = false;
    if (spinner) spinner.classList.add('hidden');
    if (btnText) btnText.textContent = 'Place Order & Pay Now';
  }
}
