CREATE TRIGGER IF NOT EXISTS trg_after_insert_categories
AFTER INSERT ON  categories
BEGIN

  INSERT INTO
    counter
    (name, count)
  VALUES
    ('categories', 1)
  ON CONFLICT (name)
  DO UPDATE
  SET
    count = count + 1;

END;


CREATE TRIGGER IF NOT EXISTS trg_after_delete_categories
AFTER DELETE ON  categories
BEGIN

  UPDATE
    counter
  SET
    count = count - 1
  WHERE
    name = 'categories';

END;
