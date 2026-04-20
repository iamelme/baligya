CREATE TRIGGER IF NOT EXISTS trg_after_insert_returns
AFTER INSERT ON returns
BEGIN

  INSERT INTO
    counter
    (name, count)
  VALUES
    ('returns', 1)
  ON CONFLICT (name)
  DO UPDATE
  SET
    count = count + 1;

END;
