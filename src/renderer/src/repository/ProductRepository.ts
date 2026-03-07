import {
  IProductRepository,
  ReturnType,
} from "../interfaces/IProductRepository";
import {
  CustomResponseType,
  Direction,
  InventoryType,
  ProductType,
} from "../shared/utils/types";
import { ipcMain } from "electron";
import { Database, SqliteError } from "better-sqlite3";

export class ProductRepository implements IProductRepository {
  private _database: Database;

  constructor(database: Database) {
    this._database = database;
    ipcMain.handle(
      "product:getAll",
      (
        _,
        params: {
          pageSize: number;
          cursorId: number;
          userId: number;
          direction?: Direction;
        },
      ) => this.getAll(params),
    );
    ipcMain.handle("product:getById", (_, id: number) => this.getById(id));
    ipcMain.handle("product:getByCode", (_, code: number) =>
      this.getByCode(code),
    );
    ipcMain.handle("product:getByName", (_, name: string) =>
      this.getByName(name),
    );
    ipcMain.handle("product:getBySku", (_, sku: string) => this.getBySku(sku));
    ipcMain.handle("product:search", (_, term: string) => this.search(term));
    ipcMain.handle("product:create", (_, params: Omit<ProductType, "id">) =>
      this.create(params),
    );
    ipcMain.handle(
      "product:update",
      (_, params: ProductType & { user_id: number }) => this.update(params),
    );
    ipcMain.handle("product:delete", (_, id: number) => this.delete(id));
  }

  getAll(params: {
    pageSize: number;
    cursorId: number;
    userId: number;
    direction?: Direction;
  }): {
    data: Array<
      ProductType & {
        inventory_id: number;
        quantity: number;
        category_name: string;
      }
    > | null;
    error: Error | "";
  } {
    const { cursorId, direction = "next", pageSize } = params;
    console.log(params);

    try {
      const db = this._database;

      let stmt = `
      SELECT p.*, i.id AS inventory_id, i.quantity, c.name as category_name
        FROM products AS p
        LEFT JOIN categories as c ON p.category_id = c.id
        LEFT JOIN inventory as i ON p.id = i.product_id
        WHERE p.is_active = 1 AND p.id > ?
        LIMIT ?`;

      if (direction === "prev") {
        stmt = `
         SELECT p.*, i.quantity, c.name as category_name
        FROM products AS p
        LEFT JOIN categories as c ON p.category_id = c.id
        LEFT JOIN inventory as i ON p.id = i.product_id
        WHERE p.is_active = 1 AND p.id < ?
        ORDER BY id DESC
        LIMIT ? `;
      }

      const products = db.prepare(stmt).all(cursorId, pageSize + 1) as Array<
        ProductType & {
          inventory_id: number;
          quantity: number;
          category_name: string;
        }
      >;

      console.log("products", products);

      if (!products) {
        throw new Error("Sorry no products");
      }

      return {
        data: products,
        error: "",
      };
    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while retrieving products"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while retrieving products"),
      };
    }
  }

  getById(id: number): ReturnType {
    const db = this._database;
    const prodStmt = db.prepare("SELECT * FROM products WHERE id = ?");
    const invStmt = db.prepare(`
                                 SELECT
                                   *
                                  FROM
                                   inventory
                                  WHERE
                                    product_id = ?
                                 `);

    try {
      const transaction = db.transaction(() => {
        const product = prodStmt.get(id) as ProductType;
        const inventory = invStmt.get(id) as InventoryType;

        return {
          ...product,
          inventory_id: inventory.id,
          quantity: inventory.quantity ?? 0,
        };
      });

      const product = transaction();

      if (!product) {
        throw new Error("Sorry can't retrieve this product");
      }

      return {
        data: product,
        error: "",
      };
    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while retrieving products"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while retrieving products"),
      };
    }
  }

  getByName(name: string): { data: ProductType | null; error: Error | string } {
    const normalizeName = name?.trim()?.toLowerCase();
    try {
      const product = this._database
        .prepare("SELECT * FROM products WHERE LOWER(name) = ?")
        .get(normalizeName) as ProductType;

      if (product) {
        return {
          data: product,
          error: "",
        };
      }

      return {
        data: null,
        error: new Error("Product not found"),
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while searching the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while searching the product"),
      };
    }
  }

  getByCode(code: number): { data: ProductType | null; error: Error | string } {
    try {
      const product = this._database
        .prepare("SELECT * FROM products WHERE code = ?")
        .get(code) as ProductType;
      if (product) {
        return {
          data: product,
          error: "",
        };
      }

      return {
        data: null,
        error: new Error("Product not found"),
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while searching the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while searching the product"),
      };
    }
  }

  getBySku(sku: string): { data: ProductType | null; error: Error | string } {
    try {
      const normalizeSKU = sku?.trim()?.toLowerCase()?.replace(/ /g, "-");
      const product = this._database
        .prepare("SELECT * FROM products WHERE sku = ?")
        .get(normalizeSKU) as ProductType;

      if (product) {
        return {
          data: product,
          error: "",
        };
      }

      return {
        data: null,
        error: new Error("Product not found"),
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while searching the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while searching the product"),
      };
    }
  }

  search(term: string): {
    data: Array<
      ProductType & { quantity: number; category_name: string }
    > | null;
    error: Error | string;
  } {
    try {
      const normalizeTerm = term?.trim();
      const products = this._database
        .prepare(
          `SELECT p.name, p.sku, p.code, p.price, c.name AS category_name, i.quantity
        FROM products p
          INNER JOIN products_fts pf ON p.id = pf.product_id
          LEFT JOIN categories as c ON p.category_id = c.id
          LEFT JOIN inventory as i ON p.id = i.product_id
        WHERE
          products_fts MATCH ?
        AND p.is_active = 1
        ORDER BY rank
        LIMIT 10`,
        )
        .all(normalizeTerm) as Array<
        ProductType & { quantity: number; category_name: string }
      >;

      console.log("normalize term", normalizeTerm);

      console.log("search products", products);

      if (products.length) {
        return {
          data: products,
          error: "",
        };
      }
      return {
        data: null,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while searching the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while searching the product"),
      };
    }
  }

  create(params: Omit<ProductType, "id">): CustomResponseType {
    const { name, sku, description, price, code, cost, category_id, user_id } =
      params;

    const normalizePrice = (price ?? 0) * 100;
    const normalizeCost = (cost ?? 0) * 100;
    const normalizeSKU = sku?.trim()?.toLowerCase()?.replace(/ /g, "-");

    console.log("params", params);

    const createdAt = new Date().toISOString();

    try {
      const db = this._database;

      const stmtInsert = db.prepare(
        `
        INSERT INTO
          products
          (name, sku, description, price, code, cost, user_id, category_id)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `,
      );

      const stmtInvMv = db.prepare(`
       INSERT INTO inventory_movement(created_at, movement_type, reference_type, quantity, reference_id, product_id, user_id)
              VALUES(?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        if (!category_id) {
          throw new Error("Category is required. Please select one");
        }

        const res = stmtInsert.get(
          name,
          normalizeSKU,
          description,
          normalizePrice,
          code,
          normalizeCost,
          user_id,
          category_id,
        ) as ProductType;

        if (!res.id) {
          throw new Error("Something went wrong while creating the product");
        }

        stmtInvMv.run(createdAt, 0, "initial_stock", 0, null, res.id, user_id);
      });

      transaction();

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.error("catch error ===>", error);
      //   if (error instanceof Error) throw new Error(error.message)
      if (error instanceof SqliteError) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
          return {
            success: false,
            error: new Error("Data needs to be unique"),
          };
        }
      }

      if (error instanceof Error) {
        return {
          success: false,
          error: error,
        };
      }
      return {
        success: false,
        error: new Error("Something went wrong while saving the product"),
      };
    }
  }

  update(params: ProductType & { user_id: number }): CustomResponseType {
    const {
      id,
      name,
      sku,
      description,
      price,
      cost,
      code,
      category_id,
      user_id,
    } = params;
    // console.log('params', params)

    const normalizePrice = (price ?? 0) * 100;
    const normalizeCost = (cost ?? 0) * 100;
    const normalizeSKU = sku?.trim()?.toUpperCase()?.replace(/ /g, "-");

    const now = new Date().toISOString();

    const db = this._database;

    try {
      const stmt = db.prepare(
        `UPDATE
          products
        SET
          name = ?,
          updated_at = ?,
          sku = ?,
          description = ?,
          price = ?,
          cost = ?,
          code = ?,
          category_id = ?,
          updated_by = ?
        WHERE
          id = ?
        RETURNING *`,
      );

      const transaction = db.transaction(() => {
        stmt.all(
          name,
          now,
          normalizeSKU,
          description,
          normalizePrice,
          normalizeCost,
          code,
          category_id,
          user_id,
          id,
        );

        return true;
      });

      const res = transaction();

      if (!res) {
        throw new Error("Something went wrong while updating the product");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return {
          success: false,
          error: new Error("Something went wrong while updating the product"),
        };
      }
      return {
        success: false,
        error: new Error("Something went wrong while updating the product"),
      };
    }
  }

  delete(id: number): CustomResponseType {
    try {
      // const transaction = this._database.transaction(() => {
      // this._database.prepare('DELETE FROM products WHERE id = ?').run(id)

      this._database
        .prepare(
          `
                             UPDATE
                              products
                              SET is_active = 0
                            WHERE id = ?
                             `,
        )
        .run(id);

      //   this._database.prepare('UPDATE counts SET products = products - 1').run()
      // })

      // transaction()

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return {
          success: false,
          error: new Error("Something went wrong while updating the product"),
        };
      }
      return {
        success: false,
        error: new Error("Something went wrong while updating the product"),
      };
    }
  }
}
