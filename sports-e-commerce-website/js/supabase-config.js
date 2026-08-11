/**
 * SUPABASE CONFIGURATION & DATA SERVICE ENGINE
 * Works with real Supabase instance when configured,
 * and provides seamless local fallback demo data when pending credentials.
 */

// Default configuration keys (saved in localStorage for persistence)
const STORAGE_KEY_SUPABASE = 'sports_ecommerce_supabase_cfg';
const STORAGE_KEY_CART = 'sports_ecommerce_cart_v1';
const STORAGE_KEY_MOCK_PRODUCTS = 'sports_ecommerce_mock_products_v1';
const STORAGE_KEY_MOCK_CATEGORIES = 'sports_ecommerce_mock_categories_v1';
const STORAGE_KEY_MOCK_ORDERS = 'sports_ecommerce_mock_orders_v1';

// Seed Initial Mock Categories
const MOCK_CATEGORIES = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Basketball', slug: 'basketball', description: 'Pro basketballs, footwear, jerseys, and court accessories.' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Running & Athletics', slug: 'running', description: 'Performance running shoes, compression wear, and hydration gear.' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Football & Soccer', slug: 'football', description: 'Match balls, cleats, shin guards, and goalkeeper gloves.' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Fitness & Gym', slug: 'fitness', description: 'Dumbbells, resistance bands, yoga mats, and recovery tools.' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Tennis & Racket', slug: 'tennis', description: 'Carbon fiber rackets, tennis balls, strings, and gear bags.' }
];

// Seed Initial Mock Products
const MOCK_PRODUCTS = [
  {
    id: 'a0111111-0000-0000-0000-000000000001',
    category_id: '11111111-1111-1111-1111-111111111111',
    category_name: 'Basketball',
    category_slug: 'basketball',
    name: 'Apex Pro Leather Basketball (Size 7)',
    slug: 'apex-pro-leather-basketball',
    price: 3500.00,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    description: 'Official composite leather game ball engineered for maximum indoor grip, consistency, and moisture management. Dynamic channel design for deep grip feel.'
  },
  {
    id: 'a0111111-0000-0000-0000-000000000002',
    category_id: '22222222-2222-2222-2222-222222222222',
    category_name: 'Running & Athletics',
    category_slug: 'running',
    name: 'UltraLight Speed Cushion Running Shoes',
    slug: 'ultralight-speed-cushion-running-shoes',
    price: 6800.00,
    stock: 8,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    description: 'Carbon-infused propulsion plate combined with ultra-responsive foam midsole for effortless marathon speed and energy transition.'
  },
  {
    id: 'a0111111-0000-0000-0000-000000000003',
    category_id: '33333333-3333-3333-3333-333333333333',
    category_name: 'Football & Soccer',
    category_slug: 'football',
    name: 'Strike Force Match Soccer Ball',
    slug: 'strike-force-match-soccer-ball',
    price: 2400.00,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=800&q=80',
    description: 'FIFA Quality Pro certified thermobonded match ball delivering true flight path, optimal aerodynamic paneling, and zero water absorption.'
  },
  {
    id: 'a0111111-0000-0000-0000-000000000004',
    category_id: '44444444-4444-4444-4444-444444444444',
    category_name: 'Fitness & Gym',
    category_slug: 'fitness',
    name: 'Hexagon Rubber Dumbbell Set (25 lbs Pair)',
    slug: 'hexagon-rubber-dumbbell-set-25lbs',
    price: 4900.00,
    stock: 5,
    image_url: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    description: 'Heavy-duty cast iron weights wrapped in protective rubber heads to safeguard gym flooring. Ergonomic knurled chrome handles.'
  },
  {
    id: 'a0111111-0000-0000-0000-000000000005',
    category_id: '55555555-5555-5555-5555-555555555555',
    category_name: 'Tennis & Racket',
    category_slug: 'tennis',
    name: 'Vanguard Graphite Tennis Racket',
    slug: 'vanguard-graphite-tennis-racket',
    price: 7500.00,
    stock: 10,
    image_url: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
    description: 'Precision engineered 100 sq inch frame crafted from high-modulus graphite. Delivers incredible control, topspin generation, and vibration dampening.'
  },
  {
    id: 'a0111111-0000-0000-0000-000000000006',
    category_id: '22222222-2222-2222-2222-222222222222',
    category_name: 'Running & Athletics',
    category_slug: 'running',
    name: 'HydraFlow Insulated Sports Water Bottle 1L',
    slug: 'hydraflow-insulated-sports-water-bottle-1l',
    price: 1150.00,
    stock: 30,
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    description: 'Double-wall vacuum insulated stainless steel bottle keeping drinks icy cold for up to 24 hours. Leakproof spout cap and ergonomic carry handle.'
  },
  {
    id: 'a0111111-0000-0000-0000-000000000007',
    category_id: '44444444-4444-4444-4444-444444444444',
    category_name: 'Fitness & Gym',
    category_slug: 'fitness',
    name: 'ProGrip Heavy Duty Fitness Resistance Bands Set',
    slug: 'progrip-heavy-duty-fitness-resistance-bands-set',
    price: 1350.00,
    stock: 20,
    image_url: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    description: 'Set of 5 natural latex loop resistance bands with stackable tension levels from 10 lbs to 150 lbs. Includes door anchor and ankle straps.'
  },
  {
    id: 'a0111111-0000-0000-0000-000000000008',
    category_id: '11111111-1111-1111-1111-111111111111',
    category_name: 'Basketball',
    category_slug: 'basketball',
    name: 'FlexFit Compression Sleeve Arm Wraps',
    slug: 'flexfit-compression-sleeve-arm-wraps',
    price: 850.00,
    stock: 18,
    image_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    description: 'Graduated compression arm sleeves designed to boost circulation, prevent muscle fatigue, and keep shooters warm on court.'
  }
];

// Initialize Mock Local Data
function initMockData() {
  if (!localStorage.getItem(STORAGE_KEY_MOCK_CATEGORIES)) {
    localStorage.setItem(STORAGE_KEY_MOCK_CATEGORIES, JSON.stringify(MOCK_CATEGORIES));
  }
  if (!localStorage.getItem(STORAGE_KEY_MOCK_PRODUCTS)) {
    localStorage.setItem(STORAGE_KEY_MOCK_PRODUCTS, JSON.stringify(MOCK_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEY_MOCK_ORDERS)) {
    localStorage.setItem(STORAGE_KEY_MOCK_ORDERS, JSON.stringify([]));
  }
}

initMockData();

// Retrieve saved configuration
function getSupabaseConfig() {
  const saved = localStorage.getItem(STORAGE_KEY_SUPABASE);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved Supabase config:", e);
    }
  }
  return {
    url: '',
    key: ''
  };
}

// Save configuration to LocalStorage
function saveSupabaseConfig(url, key) {
  const cfg = { url: url.trim(), key: key.trim() };
  localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(cfg));
  initSupabaseClient();
  return cfg;
}

// Global Supabase Client Instance
let supabaseClient = null;

function initSupabaseClient() {
  const cfg = getSupabaseConfig();
  if (cfg.url && cfg.key && window.supabase && cfg.url.startsWith('http')) {
    try {
      supabaseClient = window.supabase.createClient(cfg.url, cfg.key);
      console.log('✅ Supabase Client initialized successfully with URL:', cfg.url);
      return true;
    } catch (err) {
      console.warn('⚠️ Supabase client init error, falling back to local mode:', err);
      supabaseClient = null;
    }
  } else {
    supabaseClient = null;
  }
  return false;
}

// Check if currently connected to active Supabase database
function isSupabaseConnected() {
  return supabaseClient !== null;
}

// =========================================
// DATA ACCESS LAYER (SUPABASE + FALLBACK)
// =========================================

// Fetch Categories
async function dbFetchCategories() {
  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('Supabase categories query failed, using fallback:', e.message);
    }
  }
  
  // Local Fallback
  const stored = localStorage.getItem(STORAGE_KEY_MOCK_CATEGORIES);
  return stored ? JSON.parse(stored) : MOCK_CATEGORIES;
}

// Fetch Products with search, filter, and sorting
async function dbFetchProducts({ categorySlug, searchQuery, sort = 'newest' } = {}) {
  if (isSupabaseConnected()) {
    try {
      let query = supabaseClient.from('products').select(`
        *,
        categories (
          name,
          slug
        )
      `);

      if (categorySlug && categorySlug !== 'all') {
        // Find category ID by slug first
        const { data: catData } = await supabaseClient
          .from('categories')
          .select('id')
          .eq('slug', categorySlug)
          .single();
        if (catData) {
          query = query.eq('category_id', catData.id);
        }
      }

      if (searchQuery && searchQuery.trim() !== '') {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      if (sort === 'price-low') {
        query = query.order('price', { ascending: true });
      } else if (sort === 'price-high') {
        query = query.order('price', { ascending: false });
      } else if (sort === 'stock') {
        query = query.order('stock', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data) {
        return data.map(p => ({
          ...p,
          category_name: p.categories?.name || 'General',
          category_slug: p.categories?.slug || 'general'
        }));
      }
    } catch (e) {
      console.warn('Supabase products fetch failed, using fallback:', e.message);
    }
  }

  // Local Mock Implementation
  let products = JSON.parse(localStorage.getItem(STORAGE_KEY_MOCK_PRODUCTS) || JSON.stringify(MOCK_PRODUCTS));

  // Filter by category
  if (categorySlug && categorySlug !== 'all') {
    products = products.filter(p => p.category_slug === categorySlug);
  }

  // Search by name
  if (searchQuery && searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }

  // Sort
  if (sort === 'price-low') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-high') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'stock') {
    products.sort((a, b) => b.stock - a.stock);
  } else {
    products.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  return products;
}

// Fetch single product by ID
async function dbFetchProductById(id) {
  if (!id) return null;

  if (isSupabaseConnected()) {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        return {
          ...data,
          category_name: data.categories?.name || 'General',
          category_slug: data.categories?.slug || 'general'
        };
      }
    } catch (e) {
      console.warn('Supabase product query failed, using fallback:', e.message);
    }
  }

  // Local Fallback
  const products = JSON.parse(localStorage.getItem(STORAGE_KEY_MOCK_PRODUCTS) || JSON.stringify(MOCK_PRODUCTS));
  return products.find(p => String(p.id) === String(id)) || null;
}

// Atomic Order Creation with Stock Validation
async function dbCreateOrder(orderData) {
  const { customer_name, customer_phone, customer_email, shipping_address, payment_method, items } = orderData;

  if (isSupabaseConnected()) {
    // 1. Try RPC function `create_order_with_stock_check` first
    let rpcFailed = false;
    let domainError = null;

    try {
      const formattedItems = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.price
      }));

      const { data, error } = await supabaseClient.rpc('create_order_with_stock_check', {
        p_customer_name: customer_name,
        p_customer_phone: customer_phone,
        p_customer_email: customer_email,
        p_shipping_address: shipping_address,
        p_payment_method: payment_method,
        p_items: formattedItems
      });

      if (!error && data && data.success) {
        console.log("✅ Order created via Supabase RPC:", data.order_id);
        return { success: true, order_id: data.order_id, total_amount: data.total_amount };
      }

      if (data && data.success === false && data.error) {
        // Explicit domain validation error from stored procedure (e.g., Insufficient stock)
        domainError = data.error;
      } else if (error) {
        console.warn("RPC function unavailable or encountered system error:", error.message, "- Fallback to direct table insertion");
        rpcFailed = true;
      }
    } catch (err) {
      console.warn("RPC exception:", err.message, "- Trying direct table insertion");
      rpcFailed = true;
    }

    if (domainError) {
      return { success: false, error: domainError };
    }

    // 2. Direct Supabase Table Insert Fallback (if RPC function was not created in Supabase)
    if (rpcFailed) {
      try {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const shipping_fee = 120.00;
        const total_amount = subtotal + shipping_fee;

        // Insert Order Record
        const { data: newOrder, error: orderErr } = await supabaseClient
          .from('orders')
          .insert({
            customer_name,
            customer_phone,
            customer_email,
            shipping_address,
            payment_method,
            payment_status: payment_method === 'Cash on Delivery' ? 'Pending' : 'Paid',
            subtotal,
            shipping_fee,
            total_amount,
            order_status: 'Processing'
          })
          .select()
          .single();

        if (orderErr) {
          throw new Error("Supabase orders table insert error: " + orderErr.message);
        }

        // Insert Order Items
        const isValidUUID = (id) => typeof id === 'string' && /^[0-9a-fA-F-]{36}$/.test(id);
        const orderItemsToInsert = items.map(item => ({
          order_id: newOrder.id,
          product_id: isValidUUID(item.product_id) ? item.product_id : null,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity
        }));

        const { error: itemsErr } = await supabaseClient
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsErr) {
          console.warn("Order items insert warning:", itemsErr.message);
        }

        // Update Stock in Supabase Products
        for (const item of items) {
          if (isValidUUID(item.product_id)) {
            try {
              const { data: prod } = await supabaseClient
                .from('products')
                .select('stock')
                .eq('id', item.product_id)
                .single();
              if (prod && typeof prod.stock === 'number') {
                const newStock = Math.max(0, prod.stock - item.quantity);
                await supabaseClient
                  .from('products')
                  .update({ stock: newStock })
                  .eq('id', item.product_id);
              }
            } catch (sErr) {
              console.warn("Stock update warning:", sErr.message);
            }
          }
        }

        const fullOrderObj = {
          id: newOrder.id,
          customer_name,
          customer_phone,
          customer_email,
          shipping_address,
          payment_method,
          payment_status: payment_method === 'Cash on Delivery' ? 'Pending' : 'Paid',
          subtotal,
          shipping_fee,
          total_amount,
          order_status: 'Processing',
          items: items.map(i => ({
            product_id: i.product_id,
            name: i.name,
            image_url: i.image_url,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.price * i.quantity
          })),
          created_at: newOrder.created_at || new Date().toISOString()
        };

        // Cache locally for instant confirmation rendering
        const mockOrders = JSON.parse(localStorage.getItem(STORAGE_KEY_MOCK_ORDERS) || '[]');
        mockOrders.push(fullOrderObj);
        localStorage.setItem(STORAGE_KEY_MOCK_ORDERS, JSON.stringify(mockOrders));
        localStorage.setItem('velocity_latest_order', JSON.stringify(fullOrderObj));

        console.log("✅ Order created via direct Supabase table insertion:", newOrder.id);
        return { success: true, order_id: newOrder.id, total_amount };

      } catch (directErr) {
        console.error("Supabase direct order creation failed:", directErr.message);
        return { success: false, error: directErr.message };
      }
    }
  }

  // Local Mock Atomic Stock Engine
  const products = JSON.parse(localStorage.getItem(STORAGE_KEY_MOCK_PRODUCTS) || JSON.stringify(MOCK_PRODUCTS));

  // 1. Verify stock for all items first
  for (const item of items) {
    const product = products.find(p => String(p.id) === String(item.product_id));
    if (!product) {
      return { success: false, error: `Product "${item.name}" is no longer available.` };
    }
    if (product.stock < item.quantity) {
      return { success: false, error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}` };
    }
  }

  // 2. Calculate Subtotal & Shipping
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping_fee = 120.00;
  const total_amount = subtotal + shipping_fee;
  const newOrderId = 'ord-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);

  // 3. Deduct Stock
  for (const item of items) {
    const product = products.find(p => String(p.id) === String(item.product_id));
    if (product) {
      product.stock -= item.quantity;
    }
  }

  // Save updated product stock
  localStorage.setItem(STORAGE_KEY_MOCK_PRODUCTS, JSON.stringify(products));

  // 4. Save Order Record
  const newOrder = {
    id: newOrderId,
    customer_name,
    customer_phone,
    customer_email,
    shipping_address,
    payment_method,
    payment_status: payment_method === 'Cash on Delivery' ? 'Pending' : 'Paid',
    subtotal,
    shipping_fee,
    total_amount,
    order_status: 'Processing',
    items: items.map(i => ({
      product_id: i.product_id,
      name: i.name,
      image_url: i.image_url,
      quantity: i.quantity,
      price: i.price,
      subtotal: i.price * i.quantity
    })),
    created_at: new Date().toISOString()
  };

  const mockOrders = JSON.parse(localStorage.getItem(STORAGE_KEY_MOCK_ORDERS) || '[]');
  mockOrders.push(newOrder);
  localStorage.setItem(STORAGE_KEY_MOCK_ORDERS, JSON.stringify(mockOrders));
  localStorage.setItem('velocity_latest_order', JSON.stringify(newOrder));

  return { success: true, order_id: newOrderId, total_amount };
}

// Fetch Order Details by Order ID
async function dbFetchOrderById(orderId) {
  if (!orderId) return null;

  if (isSupabaseConnected()) {
    try {
      const { data: order, error: orderErr } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!orderErr && order) {
        const { data: items, error: itemsErr } = await supabaseClient
          .from('order_items')
          .select(`
            *,
            products (
              name,
              image_url
            )
          `)
          .eq('order_id', orderId);

        let mappedItems = [];
        if (!itemsErr && items && items.length > 0) {
          mappedItems = items.map(i => ({
            product_id: i.product_id,
            name: i.products?.name || 'Sports Item',
            image_url: i.products?.image_url || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
            quantity: i.quantity,
            price: i.unit_price,
            subtotal: i.subtotal
          }));
        } else {
          // Check local cached items
          const cached = JSON.parse(localStorage.getItem('velocity_latest_order') || '{}');
          if (cached && String(cached.id) === String(orderId) && Array.isArray(cached.items)) {
            mappedItems = cached.items;
          }
        }

        return {
          ...order,
          items: mappedItems
        };
      }
    } catch (e) {
      console.warn('Supabase fetch order error, falling back:', e.message);
    }
  }

  // Fallback to local storage cache
  const latestCached = JSON.parse(localStorage.getItem('velocity_latest_order') || 'null');
  if (latestCached && String(latestCached.id) === String(orderId)) {
    return latestCached;
  }

  const mockOrders = JSON.parse(localStorage.getItem(STORAGE_KEY_MOCK_ORDERS) || '[]');
  return mockOrders.find(o => String(o.id) === String(orderId)) || latestCached || null;
}

// Global initialization call
initSupabaseClient();
