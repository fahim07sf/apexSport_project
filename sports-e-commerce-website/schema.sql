-- ==========================================
-- SPORTS E-COMMERCE SUPABASE DATABASE SCHEMA
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP EXISTING TABLES IF ANY (FOR CLEAN SETUP)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 3. CREATE CATEGORIES TABLE
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE PRODUCTS TABLE
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE ORDERS TABLE
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash on Delivery', 'Online Payment (demo)', 'Bank Payment (demo)')),
    payment_status TEXT NOT NULL DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 15.00 CHECK (shipping_fee >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    order_status TEXT NOT NULL DEFAULT 'Processing' CHECK (order_status IN ('Processing', 'Completed', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE ORDER ITEMS TABLE
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INDEXES FOR PERFORMANCE
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Categories RLS
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);

-- Products RLS
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON products FOR UPDATE USING (true) WITH CHECK (true);

-- Orders RLS
CREATE POLICY "Public create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read orders" ON orders FOR SELECT USING (true);

-- Order Items RLS
CREATE POLICY "Public create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read order items" ON order_items FOR SELECT USING (true);


-- 9. ATOMIC STORE PROCEDURE / RPC FUNCTION FOR SAFE ORDER CREATION & STOCK DECREMENT
CREATE OR REPLACE FUNCTION create_order_with_stock_check(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_email TEXT,
    p_shipping_address TEXT,
    p_payment_method TEXT,
    p_items JSONB
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_qty INT;
    v_unit_price NUMERIC;
    v_item_subtotal NUMERIC;
    v_current_stock INT;
    v_calculated_subtotal NUMERIC := 0;
    v_shipping_fee NUMERIC := 120.00;
    v_total NUMERIC;
BEGIN
    -- Step 1: Verify stock availability for ALL items with row locking (FOR UPDATE)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        
        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for product ID %', v_qty, v_product_id;
        END IF;

        SELECT stock, price INTO v_current_stock, v_unit_price
        FROM products
        WHERE id = v_product_id
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % does not exist.', v_product_id;
        END IF;
        
        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product. Available: %, Requested: %', v_current_stock, v_qty;
        END IF;
        
        v_calculated_subtotal := v_calculated_subtotal + (v_qty * v_unit_price);
    END LOOP;

    v_total := v_calculated_subtotal + v_shipping_fee;

    -- Step 2: Insert into orders table
    INSERT INTO orders (
        customer_name,
        customer_phone,
        customer_email,
        shipping_address,
        payment_method,
        payment_status,
        subtotal,
        shipping_fee,
        total_amount,
        order_status
    ) VALUES (
        p_customer_name,
        p_customer_phone,
        p_customer_email,
        p_shipping_address,
        p_payment_method,
        CASE WHEN p_payment_method = 'Cash on Delivery' THEN 'Pending' ELSE 'Paid' END,
        v_calculated_subtotal,
        v_shipping_fee,
        v_total,
        'Processing'
    ) RETURNING id INTO v_order_id;

    -- Step 3: Insert order items & safely deduct product stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_qty := (v_item->>'quantity')::INT;
        
        SELECT price INTO v_unit_price FROM products WHERE id = v_product_id;
        v_item_subtotal := v_qty * v_unit_price;

        -- Atomic stock reduction
        UPDATE products
        SET stock = stock - v_qty
        WHERE id = v_product_id;

        -- Create order item record
        INSERT INTO order_items (
            order_id,
            product_id,
            quantity,
            unit_price,
            subtotal
        ) VALUES (
            v_order_id,
            v_product_id,
            v_qty,
            v_unit_price,
            v_item_subtotal
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'subtotal', v_calculated_subtotal,
        'shipping_fee', v_shipping_fee,
        'total_amount', v_total
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;


-- 10. SAMPLE INITIAL DATA SEEDING
INSERT INTO categories (id, name, slug, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Basketball', 'basketball', 'Pro basketballs, footwear, jerseys, and court accessories.'),
('22222222-2222-2222-2222-222222222222', 'Running & Athletics', 'running', 'Performance running shoes, compression wear, and hydration gear.'),
('33333333-3333-3333-3333-333333333333', 'Football & Soccer', 'football', 'Match balls, cleats, shin guards, and goalkeeper gloves.'),
('44444444-4444-4444-4444-444444444444', 'Fitness & Gym', 'fitness', 'Dumbbells, resistance bands, yoga mats, and recovery tools.'),
('55555555-5555-5555-5555-555555555555', 'Tennis & Racket', 'tennis', 'Carbon fiber rackets, tennis balls, strings, and gear bags.');

INSERT INTO products (id, category_id, name, slug, price, stock, image_url, description) VALUES
(
    'a0111111-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    'Apex Pro Leather Basketball (Size 7)',
    'apex-pro-leather-basketball',
    89.99,
    15,
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
    'Official composite leather game ball engineered for maximum indoor grip, consistency, and moisture management. Dynamic channel design for deep grip feel.'
),
(
    'a0111111-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    'UltraLight Speed Cushion Running Shoes',
    'ultralight-speed-cushion-running-shoes',
    149.50,
    8,
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    'Carbon-infused propulsion plate combined with ultra-responsive foam midsole for effortless marathon speed and energy transition.'
),
(
    'a0111111-0000-0000-0000-000000000003',
    '33333333-3333-3333-3333-333333333333',
    'Strike Force Match Soccer Ball',
    'strike-force-match-soccer-ball',
    59.99,
    25,
    'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=800&q=80',
    'FIFA Quality Pro certified thermobonded match ball delivering true flight path, optimal aerodynamic paneling, and zero water absorption.'
),
(
    'a0111111-0000-0000-0000-000000000004',
    '44444444-4444-4444-4444-444444444444',
    'Hexagon Rubber Dumbbell Set (25 lbs Pair)',
    'hexagon-rubber-dumbbell-set-25lbs',
    119.00,
    5,
    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    'Heavy-duty cast iron weights wrapped in protective rubber heads to safeguard gym flooring. Ergonomic knurled chrome handles.'
),
(
    'a0111111-0000-0000-0000-000000000005',
    '55555555-5555-5555-5555-555555555555',
    'Vanguard Graphite Tennis Racket',
    'vanguard-graphite-tennis-racket',
    189.99,
    10,
    'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80',
    'Precision engineered 100 sq inch frame crafted from high-modulus graphite. Delivers incredible control, topspin generation, and vibration dampening.'
),
(
    'a0111111-0000-0000-0000-000000000006',
    '22222222-2222-2222-2222-222222222222',
    'HydraFlow Insulated Sports Water Bottle 1L',
    'hydraflow-insulated-sports-water-bottle-1l',
    29.99,
    30,
    'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    'Double-wall vacuum insulated stainless steel bottle keeping drinks icy cold for up to 24 hours. Leakproof spout cap and ergonomic carry handle.'
),
(
    'a0111111-0000-0000-0000-000000000007',
    '44444444-4444-4444-4444-444444444444',
    'ProGrip Heavy Duty Fitness Resistance Bands Set',
    'progrip-heavy-duty-fitness-resistance-bands-set',
    34.50,
    20,
    'https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=800&q=80',
    'Set of 5 natural latex loop resistance bands with stackable tension levels from 10 lbs to 150 lbs. Includes door anchor and ankle straps.'
),
(
    'a0111111-0000-0000-0000-000000000008',
    '11111111-1111-1111-1111-111111111111',
    'FlexFit Compression Sleeve Arm Wraps',
    'flexfit-compression-sleeve-arm-wraps',
    22.00,
    18,
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    'Graduated compression arm sleeves designed to boost circulation, prevent muscle fatigue, and keep shooters warm on court.'
);
