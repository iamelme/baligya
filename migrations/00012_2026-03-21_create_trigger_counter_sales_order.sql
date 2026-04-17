CREATE TRIGGER IF NOT EXISTS trg_after_insert_sales_order
AFTER INSERT ON sales_order
BEGIN

  INSERT INTO
    counter
    (name, count)
  VALUES
    ('sales-order', 1)
  ON CONFLICT(name)
  DO UPDATE
  SET
    count = count + 1;

END;
