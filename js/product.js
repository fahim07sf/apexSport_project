/**
 * PRODUCT DETAILS PAGE LOGIC
 */

let currentProduct = null;
let selectedQuantity = 1;

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    showNotFoundState();
    return;
  }

  await loadProductDetails(productId);
});

async function loadProductDetails(id) {
  const container = document.getElementById('product-container');
  currentProduct = await dbFetchProductById(id);

  if (!currentProduct) {
    showNotFoundState();
    return;
  }

  // Update Breadcrumbs
  const breadCat = document.getElementById('breadcrumb-category');
  const breadName = document.getElementById('breadcrumb-product-name');
  if (breadCat) breadCat.textContent = currentProduct.category_name || 'Sports';
  if (breadName) breadName.textContent = currentProduct.name;

  // Determine Stock Badge
  let stockBadgeHtml = '';
  if (currentProduct.stock <= 0) {
    stockBadgeHtml = `<span class="badge-stock badge-out-of-stock">Out of Stock</span>`;
  } else if (currentProduct.stock <= 5) {
    stockBadgeHtml = `<span class="badge-stock badge-low-stock">Low Stock: ${currentProduct.stock} left</span>`;
  } else {
    stockBadgeHtml = `<span class="badge-stock badge-in-stock">In Stock (${currentProduct.stock} units available)</span>`;
  }

  // Render Product Page
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
      
      <!-- Product Image Viewport -->
      <div class="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative group">
        <img
          src="${currentProduct.image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'}"
          alt="${currentProduct.name}"
          class="w-full h-[400px] md:h-[500px] object-cover group-hover:scale-105 transition duration-500"
        />
        <div class="absolute top-4 left-4">
          <span class="bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shadow-xs">
            ${currentProduct.category_name || 'Sports'}
          </span>
        </div>
      </div>

      <!-- Product Information & Actions -->
      <div class="flex flex-col h-full">
        <div class="mb-4">
          <div class="mb-2">
            ${stockBadgeHtml}
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight mb-3">
            ${currentProduct.name}
          </h1>
          <div class="text-3xl font-extrabold text-blue-600 mb-6">
            ${formatCurrency(currentProduct.price)}
          </div>
        </div>

        <div class="prose prose-slate mb-8">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description & Specs</h3>
          <p class="text-slate-600 text-sm md:text-base leading-relaxed">
            ${currentProduct.description || 'Engineered for high-intensity athletic performance, featuring durable materials, ergonomic design, and optimal reliability on the field or court.'}
          </p>
        </div>

        <!-- Quantity Selector & Add to Cart -->
        <div class="mt-auto pt-6 border-t border-slate-100">
          <label class="block text-xs font-bold text-slate-700 uppercase mb-2">Quantity</label>
          
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            
            <!-- Quantity Control Buttons -->
            <div class="inline-flex items-center bg-slate-100 border border-slate-300 rounded-lg overflow-hidden">
              <button
                id="qty-decrease-btn"
                class="px-4 py-3 text-slate-700 font-bold hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                ${currentProduct.stock <= 0 ? 'disabled' : ''}
              >
                −
              </button>
              <input
                type="number"
                id="qty-input"
                value="1"
                min="1"
                max="${currentProduct.stock}"
                class="w-16 text-center font-bold text-slate-900 bg-transparent focus:outline-none text-base border-none"
                readonly
              />
              <button
                id="qty-increase-btn"
                class="px-4 py-3 text-slate-700 font-bold hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                ${currentProduct.stock <= 0 ? 'disabled' : ''}
              >
                +
              </button>
            </div>

            <!-- Add to Cart Action Button -->
            <button
              id="add-to-cart-detail-btn"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold py-3.5 px-6 rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              ${currentProduct.stock <= 0 ? 'disabled' : ''}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              <span>${currentProduct.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
          </div>

          <p id="stock-warning-text" class="text-xs text-amber-600 font-semibold mt-2 hidden">
            ⚠️ Maximum available stock limit reached.
          </p>
        </div>

        <!-- Shipping & Return Trust Badges -->
        <div class="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 text-xs font-semibold text-slate-500">
          <div class="flex items-center gap-2">
            <span>🚚</span>
            <span>Fast Standard Shipping (৳ 120)</span>
          </div>
          <div class="flex items-center gap-2">
            <span>🛡️</span>
            <span>Verified Quality Guarantee</span>
          </div>
        </div>

      </div>
    </div>
  `;

  setupQuantityControls();
  await loadRelatedProducts(currentProduct.category_slug, currentProduct.id);
}

function setupQuantityControls() {
  const decreaseBtn = document.getElementById('qty-decrease-btn');
  const increaseBtn = document.getElementById('qty-increase-btn');
  const qtyInput = document.getElementById('qty-input');
  const addToCartBtn = document.getElementById('add-to-cart-detail-btn');
  const warningText = document.getElementById('stock-warning-text');

  if (!currentProduct || currentProduct.stock <= 0) return;

  const maxStock = currentProduct.stock;

  function updateQty(val) {
    if (val < 1) val = 1;
    if (val > maxStock) {
      val = maxStock;
      if (warningText) warningText.classList.remove('hidden');
    } else {
      if (warningText) warningText.classList.add('hidden');
    }
    selectedQuantity = val;
    if (qtyInput) qtyInput.value = val;
  }

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      updateQty(selectedQuantity - 1);
    });
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      updateQty(selectedQuantity + 1);
    });
  }

  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
      CartStore.addItem(currentProduct, selectedQuantity);
    });
  }
}

async function loadRelatedProducts(categorySlug, currentId) {
  const section = document.getElementById('related-products-section');
  const grid = document.getElementById('related-products-grid');
  if (!section || !grid) return;

  const products = await dbFetchProducts({ categorySlug });
  const related = products.filter(p => String(p.id) !== String(currentId)).slice(0, 4);

  if (related.length === 0) return;

  section.classList.remove('hidden');
  grid.innerHTML = '';

  related.forEach(product => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl border border-slate-200 overflow-hidden card-shadow flex flex-col';
    card.innerHTML = `
      <a href="product.html?id=${product.id}" class="block overflow-hidden bg-slate-100">
        <img
          src="${product.image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'}"
          alt="${product.name}"
          class="w-full h-44 object-cover hover:scale-105 transition duration-300"
        />
      </a>
      <div class="p-4 flex flex-col flex-1">
        <a href="product.html?id=${product.id}" class="font-bold text-slate-900 text-sm line-clamp-1 hover:text-blue-600 mb-1">
          ${product.name}
        </a>
        <div class="text-sm font-extrabold text-blue-600 mt-auto">
          ${formatCurrency(product.price)}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function showNotFoundState() {
  const container = document.getElementById('product-container');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center py-16">
      <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
        ⚠️
      </div>
      <h2 class="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
      <p class="text-slate-500 text-sm mb-6">The requested product could not be located in our database catalog.</p>
      <a href="index.html" class="bg-sky-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-sky-700 transition">
        Browse Sports Catalog
      </a>
    </div>
  `;
}
