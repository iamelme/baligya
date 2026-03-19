CREATE TABLE IF NOT EXISTS inventory_reservation(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME,
  updated_at DATETIME,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  status TEXT DEFAULT 'active',
  -- active - being reserved,
  -- released - cancelled order,
  -- fulfilled - converted to sale,
  -- cancelled - manually cancelled
  sales_order_id INTEGER,
  product_id INTEGER,
  FOREIGN KEY (sales_order_id) REFERENCES sales_order(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
)
