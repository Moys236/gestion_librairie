-- Categories (Top-level)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

-- Types (Middle-level, previously categories)
CREATE TABLE IF NOT EXISTS types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  default_specs TEXT DEFAULT '[]',
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type_id INTEGER,
  name TEXT NOT NULL,
  reference TEXT UNIQUE,
  purchase_price REAL DEFAULT 0,
  selling_price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT 1,
  specifications TEXT DEFAULT '{}',
  FOREIGN KEY (type_id) REFERENCES types(id)
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  total_debt REAL DEFAULT 0
);

-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  contact TEXT,
  notes TEXT
);

-- School Lists (Levels)
CREATE TABLE IF NOT EXISTS school_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  level_name TEXT NOT NULL,
  file_url TEXT,
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER,
  school_id INTEGER,
  total_amount REAL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'manual', -- manual, pdf, image
  file_url TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER,
  description TEXT, -- for manual lines without products
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Debts/Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  order_id INTEGER,
  amount REAL NOT NULL,
  notes TEXT,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Stock Histories
CREATE TABLE IF NOT EXISTS stock_histories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  produit_id INTEGER NOT NULL,
  type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie')),
  quantite_unitaire INTEGER NOT NULL CHECK (quantite_unitaire > 0),
  nombre_colis INTEGER,
  date_mouvement DATETIME NOT NULL,
  stock_resultat INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produit_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stock_histories_produit_date ON stock_histories(produit_id, date_mouvement DESC);

-- Supplier Request Lists
CREATE TABLE IF NOT EXISTS supplier_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Request List Items
CREATE TABLE IF NOT EXISTS supplier_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (list_id) REFERENCES supplier_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE(list_id, product_id)
);


