CREATE TABLE IF NOT EXISTS credit_memos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME,
  cm_number TEXT GENERATED ALWAYS AS ('CM-' || printf('%08d', id)) STORED,
  amount INTEGER,
  return_id INTEGER,
  customer_id INTEGER,
  user_id INTEGER,
  sale_id INTEGER,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);


CREATE TABLE IF NOT EXISTS credit_memo_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME,
  quantity INTEGER,
  unit_price INTEGER,
  credit_memo_id INTEGER,
  product_id INTEGER,
  sale_item_id INTEGER,
  FOREIGN KEY (credit_memo_id) REFERENCES credit_memos(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (sale_item_id) REFERENCES sale_items(id)
);
