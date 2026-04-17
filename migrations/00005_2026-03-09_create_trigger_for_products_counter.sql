CREATE TRIGGER IF NOT EXISTS trg_after_insert_products
AFTER INSERT ON products
BEGIN

  INSERT INTO
    counter
    (name, count)
  VALUES
    ('products', 1)
  ON CONFLICT (name)
  DO UPDATE
  SET
    count = count + 1;

END;
