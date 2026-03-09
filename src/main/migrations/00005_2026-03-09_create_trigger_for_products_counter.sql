CREATE TRIGGER IF NOT EXISTS trg_after_insert_products
AFTER INSERT ON products
BEGIN

  UPDATE
    counter
  SET
    count = count + 1
  WHERE
    name = 'products';

END;
