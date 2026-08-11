/**
 * CART PAGE LOGIC
 */

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  setupCartListeners();
});

function renderCart() {
  const cart = CartStore.get();
  const container = document.getElementById('cart-items-container');
  const emptyState = document.getElementById('empty-cart-state');
  const cartLayout = document.getElementById('cart-content-layout');
  const clearBtn = document.getElementById('clear-cart-btn');

  if (!container || !emptyState || !cartLayout) return;

  if (cart.length === 0) {
    cartLayout.classList.add('hidden');
    emptyState.classList.remove('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }

  cartLayout.classList.remove('hidden');
  emptyState.classList.add('hidden');
  if (clearBtn) clearBtn.classList.remove('hidden');

  container.innerHTML = '';

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 last:border-none';

    const itemTotal = item.price * item.quantity;

    row.innerHTML = `
      <!-- Product Details Column -->
      <div class="flex items-center gap-4 flex-1">
        <a href="product.html?id=${item.product_id}" class="shrink-0">
          <img
            src="${item.image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'}"
            alt="${item.name}"
            class="w-20 h-20 object-cover rounded-xl border border-slate-200"
          />
        </a>

        <div>
          <span class="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            ${item.category_name || 'Sports'}
          </span>
          <a href="product.html?id=${item.product_id}" class="block font-bold text-slate-900 text-sm hover:text-blue-600 transition mt-1">
            ${item.name}
          </a>
          <div class="text-xs text-slate-500 mt-0.5">
            Unit Price: <span class="font-bold text-slate-800">${formatCurrency(item.price)}</span>
            <span class="ml-2 text-slate-400">(Available Stock: ${item.stock})</span>
          </div>
        </div>
      </div>

      <!-- Quantity & Item Total Controls -->
      <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
        
        <!-- Quantity Adjuster -->
        <div class="flex items-center bg-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          <button
            class="decrease-qty-btn px-3 py-1.5 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
            data-product-id="${item.product_id}"
          >
            −
          </button>
          <span class="w-10 text-center font-bold text-sm text-slate-900">${item.quantity}</span>
          <button
            class="increase-qty-btn px-3 py-1.5 text-slate-700 font-bold hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            data-product-id="${item.product_id}"
            ${item.quantity >= item.stock ? 'disabled title="Stock limit reached"' : ''}
          >
            +
          </button>
        </div>

        <!-- Row Subtotal -->
        <div class="text-right min-w-[90px]">
          <span class="text-xs text-slate-400 block sm:hidden">Total</span>
          <span class="text-base font-extrabold text-slate-900">${formatCurrency(itemTotal)}</span>
        </div>

        <!-- Remove Button -->
        <button
          class="remove-item-btn text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
          data-product-id="${item.product_id}"
          title="Remove item"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>

      </div>
    `;

    container.appendChild(row);
  });

  updateOrderSummary();
}

function updateOrderSummary() {
  const { subtotal, shipping, total } = CartStore.getTotals();
  const subtotalEl = document.getElementById('summary-subtotal');
  const shippingEl = document.getElementById('summary-shipping');
  const totalEl = document.getElementById('summary-total');

  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (shippingEl) shippingEl.textContent = formatCurrency(shipping);
  if (totalEl) totalEl.textContent = formatCurrency(total);
}

function setupCartListeners() {
  const container = document.getElementById('cart-items-container');
  const clearBtn = document.getElementById('clear-cart-btn');

  if (container) {
    container.addEventListener('click', (e) => {
      const decBtn = e.target.closest('.decrease-qty-btn');
      const incBtn = e.target.closest('.increase-qty-btn');
      const remBtn = e.target.closest('.remove-item-btn');

      if (decBtn) {
        const id = decBtn.dataset.productId;
        const cart = CartStore.get();
        const item = cart.find(i => String(i.product_id) === String(id));
        if (item) {
          CartStore.updateQuantity(id, item.quantity - 1);
          renderCart();
        }
      }

      if (incBtn) {
        const id = incBtn.dataset.productId;
        const cart = CartStore.get();
        const item = cart.find(i => String(i.product_id) === String(id));
        if (item) {
          CartStore.updateQuantity(id, item.quantity + 1);
          renderCart();
        }
      }

      if (remBtn) {
        const id = remBtn.dataset.productId;
        CartStore.removeItem(id);
        renderCart();
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all items from your cart?')) {
        CartStore.clear();
        renderCart();
      }
    });
  }
}
