import { join } from "path";
import Database, { type Database as DatabaseType } from "better-sqlite3";
// import { type Database as DatabaseType, Database } from 'better-sqlite3'
import { app } from "electron";

// const dbPath =
//   process.env.NODE_ENV === 'development'
//     ? './demo_table.db'
//     : join(process.resourcesPath, './demo_table.db')

// export const db = new Database(dbPath)
// db.pragma('journal_mode = WAL')

export class AppDatabase {
  db: DatabaseType;

  constructor() {
    const dbPath = join(app.getPath("userData"), "baligya.sqlite");
    console.log("dbpath", dbPath);

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.setUp();
  }

  setUp(): void {
    this.db.exec(
      `
            CREATE TABLE IF NOT EXISTS settings(
               id INTEGER PRIMARY KEY CHECK (id = 1),
              locale TEXT DEFAULT 'en-PH',
              logo TEXT,
              tax INTEGER DEFAULT 0,
              is_tax_inclusive INTEGER DEFAULT 1,
              is_redirect_to_sales INTEGER DEFAULT 0
            );

            INSERT OR IGNORE INTO settings (id) VALUES(1);

            CREATE TABLE IF NOT EXISTS users(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME,
              user_name TEXT NOT NULL,
              password TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS categories(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME,
                name TEXT UNIQUE NOT NULL,
                description TEXT
            );

            CREATE TABLE IF NOT EXISTS products(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at DATETIME,
                updated_at DATETIME,
                name TEXT UNIQUE NOT NULL,
                sku TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                price INTEGER DEFAULT 0,
                code INTEGER UNIQUE DEFAULT 0,
                cost INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                category_id INTEGER,
                user_id INTEGER,
                updated_by INTEGER,
                FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS sales(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              voided_at DATETIME,
              invoice_number TEXT,
              sub_total INTEGER DEFAULT 0,
              discount INTEGER DEFAULT 0,
              total INTEGER DEFAULT 0,
              vatable_sales INTEGER DEFAULT 0,
              vat_amount INTEGER DEFAULT 0,
              tax INTEGER DEFAULT 0,
              customer_name TEXT,
              status TEXT, -- in-progress, completed, refunded, voided
              user_id INTEGER,
              FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS sale_items(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME,
              quantity INTEGER,
              unit_price INTEGER DEFAULT 0,
              unit_cost INTEGER DEFAULT 0,
              discount INTEGER DEFAULT 0,
              line_total INTEGER DEFAULT 0,
              sale_id INTEGER,
              product_id INTEGER,
              user_id INTEGER,
              FOREIGN KEY (user_id) REFERENCES users(id),
              FOREIGN KEY (sale_id) REFERENCES sales(id),
              FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS returns(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME,
              refund_amount INTEGER,
              method TEXT,
              user_id INTEGER,
              sale_id INTEGER,
              FOREIGN KEY (user_id) REFERENCES users(id),
              FOREIGN KEY (sale_id) REFERENCES sales(id)
            );

            CREATE TABLE IF NOT EXISTS return_items(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME,
              quantity INTEGER,
              refund_price INTEGER,
              return_id INTEGER,
              sale_item_id INTEGER,
              product_id INTEGER,
              FOREIGN KEY (return_id) REFERENCES returns(id),
              FOREIGN KEY (sale_item_id) REFERENCES sale_items(id),
              FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS payments(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              amount INTEGER DEFAULT 0,
              reference_number TEXT,
              method TEXT, --- CASH, CARD, E-WALLET
              sale_id INTEGER,
              FOREIGN KEY (sale_id) REFERENCES sales(id)
            );


            CREATE TABLE IF NOT EXISTS inventory(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME,
              quantity INTEGER DEFAULT 0,
              product_id INTEGER,
              FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE TABLE IF NOT EXISTS inventory_movement(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              movement_type INTEGER, --- IN, OUT, ADJUST
              reference_type TEXT, --- SALES, PURCHASE, RETURN, TRANSFER, ADJUSTMENT
              quantity INTEGER,
              reference_id INTEGER, --- id from SALES, PURCHASE, RETURN, TRANSFER, ADJUSTMENT              user_id INTEGER,
              product_id INTEGER,
              user_id INTEGER,
              FOREIGN KEY (user_id) REFERENCES users(id),
              FOREIGN KEY (product_id) REFERENCES products(id)
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(product_id, name, sku, code);

            CREATE TABLE IF NOT EXISTS carts(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              is_active INTEGER DEFAULT 1,
              sub_total INTEGER DEFAULT 0,
              discount INTEGER DEFAULT 0,
              total INTEGER DEFAULT 0,
              vatable_sales INTEGER DEFAULT 0,
              vat_amount INTEGER DEFAULT 0,
              tax INTEGER DEFAULT 0,
              user_id INTEGER,
              FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS cart_items(
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              quantity INTEGER,
              cart_id INTEGER,
              product_id INTEGER,
              user_id INTEGER,
              FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
              FOREIGN KEY (product_id) REFERENCES products(id),
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TRIGGER IF NOT EXISTS sales_status_update
            BEFORE UPDATE ON sales
            BEGIN

              UPDATE sales
              SET voided_at = (date('now') || 'T' || time('now') || 'Z')
              WHERE id = OLD.id AND NEW.status = 'void';

            END;

            CREATE TRIGGER IF NOT EXISTS products_after_insert
            AFTER INSERT ON products
            BEGIN

              INSERT INTO inventory (product_id, quantity) VALUES(NEW.id, 0);

              INSERT INTO products_fts (product_id, name, sku, code)
              VALUES(NEW.id, NEW.name, NEW.sku, NEW.code);
            END;

            CREATE TRIGGER IF NOT EXISTS products_after_update
            AFTER UPDATE ON products
            BEGIN

              UPDATE products_fts
              SET name = NEW.name, sku = NEW.sku, code = NEW.code
              WHERE product_id = OLD.id;
            END;

            CREATE TRIGGER IF NOT EXISTS products_after_delete
            AFTER DELETE ON products
            BEGIN

              DELETE FROM inventory
              WHERE product_id = OLD.id;

              DELETE FROM products_fts
              WHERE product_id = OLD.id;
            END;

            `,
    );

    console.log("database is created");
  }
}
