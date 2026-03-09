CREATE TRIGGER IF NOT EXISTS trg_after_insert_sales
AFTER INSERT ON sales
BEGIN

  UPDATE
    counter
  SET
    count = count + 1
  WHERE
    name = 'sales';

END;
