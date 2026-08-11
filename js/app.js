/**
 * COMMON APP SCRIPT
 * Handles header cart badge update, toast notifications,
 * cart store synchronization, and Supabase config modal.
 */

// Cart Store helper functions
const CartStore = {
  KEY: 'sports_ecommerce_cart_v1',

  get() {
    try {
      const stored = localStorage.getItem(this.KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse cart:', e);
      return [];
    }
  },

  save(cart) {
    localStorage.setItem(this.KEY, JSON.stringify(cart));
    updateCartBadge();
  },

  addItem(product, qtyToAdd = 1) {
    const cart = this.get();
    const existingIndex = cart.findIndex(item => String(item.product_id) === String(product.id));
    const availableStock = product.stock;

    if (availableStock <= 0) {
      showToast('Sorry, this product is currently out of stock!', 'error');
      return false;
    }

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty + qtyToAdd > availableStock) {
        showToast(`Cannot add more. Maximum available stock is ${availableStock}.`, 'error');
        return false;
      }
      cart[existingIndex].quantity += qtyToAdd;
    } else {
      if (qtyToAdd > availableStock) {
        showToast(`Cannot add more. Maximum available stock is ${availableStock}.`, 'error');
        return false;
      }
      cart.push({
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        category_name: product.category_name,
        stock: availableStock,
        quantity: qtyToAdd
      });
    }

    this.save(cart);
    showToast(`Added "${product.name}" to cart!`, 'success');
    return true;
  },

  updateQuantity(productId, newQty) {
    let cart = this.get();
    const item = cart.find(i => String(i.product_id) === String(productId));

    if (!item) return false;

    if (newQty > item.stock) {
      showToast(`Cannot increase quantity. Maximum available stock is ${item.stock}.`, 'error');
      return false;
    }

    if (newQty <= 0) {
      return this.removeItem(productId);
    }

    item.quantity = newQty;
    this.save(cart);
    return true;
  },

  removeItem(productId) {
    let cart = this.get();
    const item = cart.find(i => String(i.product_id) === String(productId));
    cart = cart.filter(i => String(i.product_id) !== String(productId));
    this.save(cart);
    if (item) {
      showToast(`Removed "${item.name}" from cart.`, 'info');
    }
    return true;
  },

  clear() {
    localStorage.removeItem(this.KEY);
    updateCartBadge();
  },

  getTotals() {
    const cart = this.get();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = cart.length > 0 ? 15.00 : 0.00;
    const total = subtotal + shipping;
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      subtotal,
      shipping,
      total,
      itemCount
    };
  }
};

// UI Helper: Update Cart Counter Badges
function updateCartBadge() {
  const { itemCount } = CartStore.getTotals();
  const badges = document.querySelectorAll('.cart-count-badge');
  badges.forEach(badge => {
    badge.textContent = itemCount;
    if (itemCount > 0) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });
}

// UI Helper: Toast Notifications
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="ml-3 text-slate-400 hover:text-white">&times;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Currency Formatter (Bangladeshi Taka - BDT ৳)
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `৳ ${num.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

// User Profile Store
const UserProfileStore = {
  KEY: 'velocity_user_profile_v1',

  get() {
    try {
      const stored = localStorage.getItem(this.KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      console.error('Failed to parse user profile:', e);
      return null;
    }
  },

  save(profile) {
    const cleanProfile = {
      full_name: (profile.full_name || '').trim(),
      phone: (profile.phone || '').trim(),
      email: (profile.email || '').trim(),
      address: (profile.address || '').trim(),
      city: (profile.city || 'Dhaka').trim(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(this.KEY, JSON.stringify(cleanProfile));
    initUserProfileUI();
    return cleanProfile;
  },

  clear() {
    localStorage.removeItem(this.KEY);
    initUserProfileUI();
  },

  isComplete() {
    const p = this.get();
    return !!(p && p.full_name && p.phone && p.email && p.address);
  }
};

// User Profile Management Modal & Header UI
function initUserProfileUI() {
  const profile = UserProfileStore.get();
  const navs = document.querySelectorAll('header nav');

  // 1. Inject or update profile button in nav
  navs.forEach(nav => {
    let btnContainer = nav.querySelector('.user-profile-nav-item');
    if (!btnContainer) {
      btnContainer = document.createElement('div');
      btnContainer.className = 'user-profile-nav-item inline-flex items-center';
      nav.insertBefore(btnContainer, nav.firstChild);
    }

    if (profile && profile.full_name) {
      const initials = profile.full_name.substring(0, 2).toUpperCase();
      btnContainer.innerHTML = `
        <button
          onclick="openUserProfileModal()"
          class="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
          title="User Profile Settings"
        >
          <span class="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold text-[10px]">
            ${initials}
          </span>
          <span class="max-w-[100px] truncate hidden sm:inline-block">${profile.full_name}</span>
          <span class="text-emerald-400 text-[10px]">✓</span>
        </button>
      `;
    } else {
      btnContainer.innerHTML = `
        <button
          onclick="openUserProfileModal()"
          class="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-extrabold px-3 py-1.5 rounded-lg transition cursor-pointer"
        >
          <span>👤 Profile</span>
          <span class="text-[10px] bg-amber-500 text-black font-extrabold px-1.5 rounded-full animate-pulse">Required</span>
        </button>
      `;
    }
  });

  // 2. Ensure Profile Modal exists in DOM
  let modal = document.getElementById('user-profile-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'user-profile-modal';
    modal.className = 'hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 border border-slate-200 relative animate-fadeIn">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              👤
            </div>
            <div>
              <h3 class="text-lg font-extrabold text-slate-900">User Profile Management</h3>
              <p class="text-xs text-slate-500">Manage your profile & default shipping details</p>
            </div>
          </div>
          <button onclick="closeUserProfileModal()" class="text-slate-400 hover:text-slate-700 text-2xl font-bold cursor-pointer line-height-none">&times;</button>
        </div>

        <div id="profile-notice-box" class="mb-4 hidden p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>A complete user profile (Name, Phone, Email, Delivery Address) is required to place orders.</span>
        </div>

        <form id="user-profile-form" onsubmit="saveUserProfileForm(event)" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                id="profile-name-input"
                required
                placeholder="e.g., Sakib Ahmed"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Mobile Phone *</label>
              <input
                type="tel"
                id="profile-phone-input"
                required
                placeholder="e.g., 01700123456"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                id="profile-email-input"
                required
                placeholder="e.g., sakib@example.com"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase mb-1">City / Division *</label>
              <input
                type="text"
                id="profile-city-input"
                required
                placeholder="e.g., Dhaka"
                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Delivery Address *</label>
            <textarea
              id="profile-address-input"
              rows="3"
              required
              placeholder="e.g., House 12, Road 5, Block B, Mirpur 11, Dhaka"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            ></textarea>
          </div>

          <div class="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onclick="clearUserProfile()"
              class="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
            >
              Reset Profile
            </button>

            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick="closeUserProfileModal()"
                class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition shadow-md cursor-pointer"
              >
                Save Profile
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Populate input fields if profile exists
  if (profile) {
    const nameIn = document.getElementById('profile-name-input');
    const phoneIn = document.getElementById('profile-phone-input');
    const emailIn = document.getElementById('profile-email-input');
    const cityIn = document.getElementById('profile-city-input');
    const addrIn = document.getElementById('profile-address-input');

    if (nameIn) nameIn.value = profile.full_name || '';
    if (phoneIn) phoneIn.value = profile.phone || '';
    if (emailIn) emailIn.value = profile.email || '';
    if (cityIn) cityIn.value = profile.city || 'Dhaka';
    if (addrIn) addrIn.value = profile.address || '';
  }
}

// Global modal helpers
window.openUserProfileModal = function(showNotice = false) {
  initUserProfileUI();
  const modal = document.getElementById('user-profile-modal');
  const noticeBox = document.getElementById('profile-notice-box');
  if (modal) modal.classList.remove('hidden');
  if (noticeBox) {
    if (showNotice || !UserProfileStore.isComplete()) {
      noticeBox.classList.remove('hidden');
    } else {
      noticeBox.classList.add('hidden');
    }
  }
};

window.closeUserProfileModal = function() {
  const modal = document.getElementById('user-profile-modal');
  if (modal) modal.classList.add('hidden');
};

window.saveUserProfileForm = function(e) {
  e.preventDefault();
  const name = document.getElementById('profile-name-input').value;
  const phone = document.getElementById('profile-phone-input').value;
  const email = document.getElementById('profile-email-input').value;
  const city = document.getElementById('profile-city-input').value;
  const address = document.getElementById('profile-address-input').value;

  UserProfileStore.save({
    full_name: name,
    phone: phone,
    email: email,
    city: city,
    address: address
  });

  showToast('User profile saved successfully!', 'success');
  closeUserProfileModal();

  // If on checkout page, auto populate form inputs
  if (typeof populateCheckoutFormFromProfile === 'function') {
    populateCheckoutFormFromProfile();
  }
};

window.clearUserProfile = function() {
  if (confirm('Are you sure you want to clear your saved user profile?')) {
    UserProfileStore.clear();
    const nameIn = document.getElementById('profile-name-input');
    const phoneIn = document.getElementById('profile-phone-input');
    const emailIn = document.getElementById('profile-email-input');
    const cityIn = document.getElementById('profile-city-input');
    const addrIn = document.getElementById('profile-address-input');

    if (nameIn) nameIn.value = '';
    if (phoneIn) phoneIn.value = '';
    if (emailIn) emailIn.value = '';
    if (cityIn) cityIn.value = '';
    if (addrIn) addrIn.value = '';

    showToast('User profile reset.', 'info');
  }
};

// Setup Supabase Modal and Banner Initialization
function initSupabaseUI() {
  const banner = document.getElementById('supabase-status-banner');
  const modal = document.getElementById('supabase-modal');
  const openBtn = document.getElementById('open-supabase-modal-btn');
  const closeBtn = document.getElementById('close-supabase-modal-btn');
  const saveBtn = document.getElementById('save-supabase-config-btn');
  const urlInput = document.getElementById('supabase-url-input');
  const keyInput = document.getElementById('supabase-key-input');
  const statusBadge = document.getElementById('supabase-connection-status');

  const cfg = getSupabaseConfig();
  if (urlInput) urlInput.value = cfg.url || '';
  if (keyInput) keyInput.value = cfg.key || '';

  const connected = isSupabaseConnected();

  if (statusBadge) {
    if (connected) {
      statusBadge.innerHTML = `<span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">● Supabase Connected</span>`;
    } else {
      statusBadge.innerHTML = `<span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">● Local Demo Mode</span>`;
    }
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const u = urlInput ? urlInput.value : '';
      const k = keyInput ? keyInput.value : '';
      saveSupabaseConfig(u, k);
      showToast('Supabase configuration saved! Reloading data...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    });
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initUserProfileUI();
  initSupabaseUI();
});
