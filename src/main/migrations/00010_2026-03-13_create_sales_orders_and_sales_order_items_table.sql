CREATE TABLE IF NOT EXISTS sales_order(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME,
  due_at DATETIME,
  order_number TEXT GENERATED ALWAYS AS ('SO-' || printf('%08d', id)) STORED,
  status TEXT DEFAULT 'draft', -- draft | confirmed | fulfilled | complete | cancelled
  bill_to TEXT,
  ship_to TEXT,
  sub_total INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  vatable_sales INTEGER DEFAULT 0,
  vat_amount INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0,
  notes TEXT,
  customer_id INTEGER,
  user_id INTEGER,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS sales_order_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME,
  quantity INTEGER DEFAULT 0,
  unit_price INTEGER DEFAULT 0,
  unit_cost INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  line_total INTEGER DEFAULT 0,
  product_id INTEGER,
  sales_order_id INTEGER,
  user_id INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (sales_order_id) REFERENCES sales_order(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

