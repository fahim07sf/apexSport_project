/**
 * ORDER CONFIRMATION / SUCCESS PAGE LOGIC
 */

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  let orderId = params.get('orderId');

  if (!orderId) {
    const latest = JSON.parse(localStorage.getItem('velocity_latest_order') || 'null');
    if (latest && latest.id) {
      orderId = latest.id;
    }
  }

  if (!orderId) {
    showErrorState('No order found. Please place an order first.');
    return;
  }

  await loadOrderReceipt(orderId);
});

async function loadOrderReceipt(orderId) {
  const card = document.getElementById('order-success-card');
  if (!card) return;

  const order = await dbFetchOrderById(orderId);

  if (!order) {
    showErrorState(`Order with ID "${orderId}" could not be located.`);
    return;
  }

  const itemsHtml = (order.items || []).map(item => `
    <div class="py-3 flex items-center justify-between text-xs sm:text-sm border-b border-slate-100 last:border-none">
      <div class="flex items-center gap-3">
        <img
          src="${item.image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'}"
          alt="${item.name}"
          class="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
        />
        <div class="text-left">
          <p class="font-bold text-slate-900 leading-tight">${item.name}</p>
          <p class="text-slate-400 text-xs mt-0.5">Qty: ${item.quantity} × ${formatCurrency(item.price)}</p>
        </div>
      </div>
      <span class="font-extrabold text-slate-900">${formatCurrency((item.quantity * item.price) || item.subtotal || 0)}</span>
    </div>
  `).join('');

  card.innerHTML = `
    <!-- Animated Checkmark Badge -->
    <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-bounce">
      ✓
    </div>

    <span class="inline-block bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-2">
      Order Confirmed
    </span>

    <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Thank You For Your Order!</h1>
    <p class="text-slate-500 text-sm max-w-md mx-auto mb-6">
      Your sports equipment order has been registered in the database and is now being prepared for shipment.
    </p>

    <!-- Order Summary Details Box -->
    <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-left mb-8 space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
        <div>
          <span class="text-xs text-slate-400 uppercase font-bold block">Order Reference ID</span>
          <span class="font-mono text-sm font-extrabold text-slate-900">${order.id}</span>
        </div>
        <div class="text-left sm:text-right">
          <span class="text-xs text-slate-400 uppercase font-bold block">Date</span>
          <span class="text-xs font-semibold text-slate-700">${new Date(order.created_at || Date.now()).toLocaleDateString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
      </div>

      <!-- Customer Details -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div>
          <span class="text-slate-400 font-bold uppercase block mb-0.5">Customer Name</span>
          <span class="font-semibold text-slate-900">${order.customer_name}</span>
          <span class="block text-slate-500">${order.customer_phone}</span>
          <span class="block text-slate-500">${order.customer_email}</span>
        </div>

        <div>
          <span class="text-slate-400 font-bold uppercase block mb-0.5">Shipping Address</span>
          <p class="font-semibold text-slate-900 whitespace-pre-line leading-snug">${order.shipping_address}</p>
        </div>
      </div>

      <!-- Payment Status -->
      <div class="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-400 font-bold uppercase block">Payment Method</span>
          <span class="font-semibold text-slate-900">${order.payment_method}</span>
        </div>
        <div class="text-right">
          <span class="text-slate-400 font-bold uppercase block">Payment Status</span>
          <span class="inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${order.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${order.payment_status || 'Pending'}
          </span>
        </div>
      </div>
    </div>

    <!-- Purchased Items Table -->
    <div class="text-left mb-8">
      <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Purchased Items</h3>
      <div class="bg-white border border-slate-200 rounded-2xl p-4 divide-y divide-slate-100">
        ${itemsHtml}
      </div>
    </div>

    <!-- Order Totals -->
    <div class="bg-[#0f172a] text-white rounded-xl p-6 text-left mb-8 space-y-2 border-b-4 border-blue-600">
      <div class="flex justify-between text-xs text-slate-300">
        <span>Subtotal</span>
        <span>${formatCurrency(order.subtotal || 0)}</span>
      </div>
      <div class="flex justify-between text-xs text-slate-300">
        <span>Standard Shipping</span>
        <span>${formatCurrency(order.shipping_fee || 120)}</span>
      </div>
      <div class="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-extrabold">
        <span>Total Paid</span>
        <span class="text-xl text-blue-400">${formatCurrency(order.total_amount || 0)}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <button
        onclick="window.print()"
        class="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg transition cursor-pointer"
      >
        🖨️ Print Receipt
      </button>

      <a
        href="index.html"
        class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider px-8 py-3 rounded-lg shadow-md transition"
      >
        Continue Shopping →
      </a>
    </div>
  `;
}

function showErrorState(msg) {
  const card = document.getElementById('order-success-card');
  if (!card) return;

  card.innerHTML = `
    <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
      ⚠️
    </div>
    <h1 class="text-2xl font-bold text-slate-900 mb-2">Order Not Found</h1>
    <p class="text-slate-500 text-sm mb-6">${msg}</p>
    <a href="index.html" class="bg-blue-600 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-lg hover:bg-blue-700 transition">
      Back to Sports Catalog
    </a>
  `;
}
