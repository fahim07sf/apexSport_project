/**
 * HOME / PRODUCTS LISTING PAGE LOGIC
 */

let currentCategory = 'all';
let currentSearch = '';
let currentSort = 'newest';

document.addEventListener('DOMContentLoaded', async () => {
  await loadCategories();
  await loadProducts();
  setupEventListeners();
});

// Load Categories and render category tab buttons
async function loadCategories() {
  const categories = await dbFetchCategories();
  const pillsContainer = document.getElementById('category-pills');
  if (!pillsContainer) return;

  // Keep "All Products" button and append dynamic categories
  pillsContainer.innerHTML = `
    <button data-category="all" class="category-pill bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition shadow-xs">
      All Products
    </button>
  `;

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.dataset.category = cat.slug;
    btn.className = 'category-pill bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition';
    btn.textContent = cat.name;
    pillsContainer.appendChild(btn);
  });
}

// Fetch and render products grid
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  const emptyState = document.getElementById('no-products-state');
  if (!grid) return;

  // Show loading skeleton
  grid.innerHTML = `
    <div class="col-span-full py-12 text-center text-slate-400 font-medium animate-pulse">
      Loading products catalog...
    </div>
  `;

  const products = await dbFetchProducts({
    categorySlug: currentCategory,
    searchQuery: currentSearch,
    sort: currentSort
  });

  if (products.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  grid.innerHTML = '';

  products.forEach(product => {
    const card = renderProductCard(product);
    grid.appendChild(card);
  });
}

// Generate Product Card Element
function renderProductCard(product) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl border border-slate-200 overflow-hidden card-shadow flex flex-col h-full';

  // Determine stock status badge
  let stockBadgeHtml = '';
  if (product.stock <= 0) {
    stockBadgeHtml = `<span class="badge-stock badge-out-of-stock">Out of Stock</span>`;
  } else if (product.stock <= 5) {
    stockBadgeHtml = `<span class="badge-stock badge-low-stock">Only ${product.stock} left</span>`;
  } else {
    stockBadgeHtml = `<span class="badge-stock badge-in-stock">In Stock (${product.stock})</span>`;
  }

  card.innerHTML = `
    <div class="relative bg-slate-100 group overflow-hidden">
      <a href="product.html?id=${product.id}">
        <img
          src="${product.image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'}"
          alt="${product.name}"
          class="w-full h-52 object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
        />
      </a>
      <div class="absolute top-3 left-3">
        <span class="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-xs">
          ${product.category_name || 'Sports'}
        </span>
      </div>
      <div class="absolute top-3 right-3">
        ${stockBadgeHtml}
      </div>
    </div>

    <div class="p-5 flex flex-col flex-1">
      <a href="product.html?id=${product.id}" class="hover:text-blue-600 transition">
        <h3 class="text-slate-900 font-bold text-base line-clamp-1 mb-1" title="${product.name}">
          ${product.name}
        </h3>
      </a>

      <p class="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed flex-1">
        ${product.description || 'Professional grade sports item with high durability.'}
      </p>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
        <div>
          <span class="text-[10px] uppercase font-bold text-slate-400 block -mb-0.5">Price</span>
          <span class="text-xl font-extrabold text-blue-600">${formatCurrency(product.price)}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <a
            href="product.html?id=${product.id}"
            class="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-bold px-3 py-2 rounded-lg transition"
          >
            Details
          </a>
          <button
            data-product-id="${product.id}"
            class="add-to-cart-btn bg-[#0f172a] hover:bg-blue-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
            ${product.stock <= 0 ? 'disabled' : ''}
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach Add to Cart Listener
  const addBtn = card.querySelector('.add-to-cart-btn');
  if (addBtn && product.stock > 0) {
    addBtn.addEventListener('click', (e) => {
      e.preventDefault();
      CartStore.addItem(product, 1);
    });
  }

  return card;
}

// Event Listeners for Filters, Search & Sort
function setupEventListeners() {
  // Category Pill Clicks
  const pillsContainer = document.getElementById('category-pills');
  if (pillsContainer) {
    pillsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-pill');
      if (!btn) return;

      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition';
      });

      btn.className = 'category-pill bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition shadow-xs';

      currentCategory = btn.dataset.category || 'all';
      updateActiveFiltersUI();
      loadProducts();
    });
  }

  // Header Search Input
  const searchInput = document.getElementById('header-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      currentSearch = e.target.value;
      updateActiveFiltersUI();
      loadProducts();
    }, 300));
  }

  // Mobile Search Input
  const mobileSearchInput = document.getElementById('mobile-search-input');
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('input', debounce((e) => {
      currentSearch = e.target.value;
      updateActiveFiltersUI();
      loadProducts();
    }, 300));
  }

  // Sort Select
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadProducts();
    });
  }

  // Clear Filters Button
  const clearFiltersBtn = document.getElementById('clear-filters-btn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      currentCategory = 'all';
      currentSearch = '';
      if (searchInput) searchInput.value = '';
      if (mobileSearchInput) mobileSearchInput.value = '';
      
      document.querySelectorAll('.category-pill').forEach(b => {
        b.className = 'category-pill bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition';
      });
      const allBtn = document.querySelector('[data-category="all"]');
      if (allBtn) allBtn.className = 'category-pill bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition shadow-xs';

      updateActiveFiltersUI();
      loadProducts();
    });
  }

  // Reset Search Button in Empty State
  const resetBtn = document.getElementById('reset-search-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (clearFiltersBtn) clearFiltersBtn.click();
    });
  }
}

// Update Active Filters Tag UI
function updateActiveFiltersUI() {
  const bar = document.getElementById('active-filters-bar');
  const tag = document.getElementById('active-filter-tag');
  if (!bar || !tag) return;

  const parts = [];
  if (currentCategory !== 'all') parts.push(`Category: ${currentCategory}`);
  if (currentSearch.trim() !== '') parts.push(`Search: "${currentSearch.trim()}"`);

  if (parts.length > 0) {
    tag.querySelector('span').textContent = parts.join(' | ');
    bar.classList.remove('hidden');
  } else {
    bar.classList.add('hidden');
  }
}

// Utility Debounce function for smooth search typing
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
