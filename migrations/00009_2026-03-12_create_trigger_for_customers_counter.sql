CREATE TRIGGER IF NOT EXISTS trg_after_insert_customers
AFTER INSERT ON customers
BEGIN

  INSERT INTO
    counter
    (name, count)
  VALUES
    ('customers', 1)
  ON CONFLICT (name)
  DO UPDATE
  SET
    count = count + 1;

END;

CREATE TRIGGER IF NOT EXISTS trg_after_delete_customers
AFTER DELETE ON customers
BEGIN

  UPDATE
    counter
  SET
    count = count - 1
  WHERE
    name = 'customers';

END;
