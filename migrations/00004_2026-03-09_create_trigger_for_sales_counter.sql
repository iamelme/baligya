CREATE TRIGGER IF NOT EXISTS trg_after_insert_sales
AFTER INSERT ON sales
BEGIN

  INSERT INTO
    counter
    (name, count)
  VALUES
    ('sales', 1)
  ON CONFLICT (name)
  DO UPDATE
  SET
    count = count + 1;

END;
