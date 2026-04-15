import {
  GetAllParams,
  IProductRepository,
  ReturnAllProductType,
  ReturnType,
} from "../interfaces/IProductRepository";
import {
  CustomResponseType,
  InventoryType,
  ProductType,
} from "../../renderer/src/shared/utils/types";
import { ipcMain } from "electron";
import { SqliteError } from "better-sqlite3";
import { AppDatabase } from "../database/db";

export class ProductRepository implements IProductRepository {
  private _database: AppDatabase;

  constructor(database: AppDatabase) {
    this._database = database;
    ipcMain.handle("product:getAll", (_, params: GetAllParams) =>
      this.getAll(params),
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

  getAll(params: GetAllParams): ReturnAllProductType {
    const { pageSize, offset } = params;
    console.log(params);

    try {
      const db = this._database.getDb();

      // let stmt = `
      // SELECT p.*, i.id AS inventory_id, i.quantity, c.name as category_name
      //   FROM products AS p
      //   LEFT JOIN categories as c ON p.category_id = c.id
      //   LEFT JOIN inventory as i ON p.id = i.product_id
      //   WHERE p.is_active = 1 AND p.id > ?
      //   LIMIT ?`;
      //
      // if (direction === "prev") {
      //   stmt = `
      //    SELECT p.*, i.quantity, c.name as category_name
      //   FROM products AS p
      //   LEFT JOIN categories as c ON p.category_id = c.id
      //   LEFT JOIN inventory as i ON p.id = i.product_id
      //   WHERE p.is_active = 1 AND p.id < ?
      //   ORDER BY id DESC
      //   LIMIT ? `;
      // }
      //

      const stmt = db.prepare(`
        SELECT
          p.*,
          i.id AS inventory_id,
          i.quantity,
          COALESCE((i.quantity - COALESCE(ir.quantity, 0)), 0) AS available,
          c.name as category_name
        FROM
          products AS p
        LEFT JOIN
          categories as c ON p.category_id = c.id
        LEFT JOIN (
          SELECT
            product_id,
            SUM(quantity) AS quantity
          FROM
            inventory_reservation
          WHERE
            status = 'active'
          GROUP BY
            product_id
        ) AS ir
        ON
          ir.product_id = p.id
        LEFT JOIN
          inventory as i ON p.id = i.product_id
        LIMIT :limit
        OFFSET :offset
        `);

      const stmtCount = db.prepare(`
          SELECT
            count
          FROM
            counter
          WHERE
            name = :name`);

      const transaction = db.transaction(() => {
        const products = stmt.all({
          ...params,
          limit: pageSize,
          offset: offset ? offset * pageSize : offset,
        }) as Array<
          ProductType & {
            inventory_id: number;
            quantity: number;
            category_name: string;
            available: number;
          }
        >;

        console.log("products", products);

        if (!products) {
          throw new Error("Sorry no products");
        }

        const total = stmtCount.get({ name: "products" }) as { count: number };

        return {
          total: total?.count || 0,
          results: products,
        };
      });

      const res = transaction();

      return {
        data: res,
        error: "",
      };
    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        return {
          data: {
            total: 0,
            results: null,
          },
          error: new Error("Something went wrong while retrieving products"),
        };
      }
      return {
        data: {
          total: 0,
          results: null,
        },
        error: new Error("Something went wrong while retrieving products"),
      };
    }
  }

  getById(id: number): ReturnType {
    const db = this._database.getDb();
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
      const db = this._database.getDb();

      const product = db
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
      const db = this._database.getDb();
      const product = db
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

      const db = this._database.getDb();
      const product = db
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

  search(term: string): ReturnAllProductType {
    try {
      const normalizeTerm = term?.trim();

      const db = this._database.getDb();

      const stmt = db.prepare(`
          SELECT
            p.name,
            p.sku,
            p.code,
            p.cost,
            p.price,
            p.unit,
            p.is_active,
            c.name AS category_name,
            i.quantity,
            COALESCE((i.quantity - COALESCE(ir.quantity, 0)), 0) AS available,
            p.id
          FROM products p
            INNER JOIN products_fts pf ON p.id = pf.product_id
            LEFT JOIN categories AS c ON p.category_id = c.id
            LEFT JOIN inventory AS i ON p.id = i.product_id
            LEFT JOIN (
              SELECT
                product_id,
                SUM(quantity) AS quantity
              FROM
                inventory_reservation
              WHERE
                status = 'active'
              GROUP BY
                product_id
              ) AS ir ON ir.product_id = p.id
            WHERE
              products_fts MATCH ?
          ORDER BY rank
          LIMIT 10`);

      const transaction = db.transaction(() => {
        const products = stmt.all(
          `${normalizeTerm}*`,
        ) as ReturnAllProductType["data"]["results"];

        console.log({ normalizeTerm });

        if (!products) {
          return {
            total: 0,
            results: null,
          };
        }

        return {
          total: 0,
          results: products,
        };
      });

      const res = transaction();

      return {
        data: res,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: {
            total: 0,
            results: null,
          },
          error: new Error("Something went wrong while searching the product"),
        };
      }
      return {
        data: {
          total: 0,
          results: null,
        },
        error: new Error("Something went wrong while searching the product"),
      };
    }
  }

  create(params: Omit<ProductType, "id">): CustomResponseType {
    const {
      name,
      sku,
      description,
      price,
      code,
      cost,
      unit,
      category_id,
      user_id,
    } = params;

    const normalizePrice = (price ?? 0) * 100;
    const normalizeCost = (cost ?? 0) * 100;
    const normalizeSKU = sku?.trim()?.toUpperCase()?.replace(/ /g, "-");

    console.log("params", params);

    const createdAt = new Date().toISOString();

    try {
      const db = this._database.getDb();

      const stmtInsert = db.prepare(
        `
        INSERT INTO
          products
          (name, sku, description, price, code, cost, unit, user_id, category_id)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          unit,
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
      is_active,
      category_id,
      user_id,
    } = params;
    // console.log('params', params)

    const normalizePrice = (price ?? 0) * 100;
    const normalizeCost = (cost ?? 0) * 100;
    const normalizeSKU = sku?.trim()?.toUpperCase()?.replace(/ /g, "-");

    const now = new Date().toISOString();

    const db = this._database.getDb();

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
          is_active = ?,
          category_id = ?,
          updated_by = ?
        WHERE
          id = ?
        RETURNING *`,
      );

      const product = stmt.run(
        name,
        now,
        normalizeSKU,
        description,
        normalizePrice,
        normalizeCost,
        code,
        is_active,
        category_id,
        user_id,
        id,
      );

      if (!product.changes) {
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

      const db = this._database.getDb();
      db.prepare(
        `
                             UPDATE
                              products
                              SET is_active = 0
                            WHERE id = ?
                             `,
      ).run(id);

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
