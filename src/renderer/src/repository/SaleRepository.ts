import { Database } from "better-sqlite3";
import { IInventoryRepository } from "../interfaces/IInventoryRepository";
import {
  SaleItem,
  ISaleRepository,
  ReturnType,
  Direction,
  TopItemsType,
} from "../interfaces/ISaleRepository";
import {
  ErrorType,
  InventoryType,
  PlaceOrderType,
  ReturnRevenueType,
  SaleItemType,
  SaleType,
} from "../shared/utils/types";
import { ipcMain } from "electron";

export class SaleRepository implements ISaleRepository {
  private _database: Database;
  private _inventory: IInventoryRepository;
  constructor(database: Database, inventory: IInventoryRepository) {
    this._database = database;
    this._inventory = inventory;
    ipcMain.handle(
      "sale:getAll",
      (
        _,
        params: {
          startDate: string;
          endDate: string;
          pageSize: number;
          cursorId: number;
          userId: number;
          direction?: Direction;
        },
      ) => this.getAll(params),
    );
    ipcMain.handle("sale:getByUserId", (_, id: number) => this.getByUserId(id));
    ipcMain.handle("sale:getById", (_, id: number) => this.getById(id));
    ipcMain.handle(
      "sale:getRevenue",
      (_, params: { startDate: string; endDate: string }) =>
        this.getRevenue(params),
    );
    ipcMain.handle(
      "sale:getTopItems",
      (
        _,
        params: {
          pageSize: number;
          cursorId: number;
          lastTotal: number;
          direction?: Direction;
          startDate: string;
          endDate: string;
        },
      ) => this.getTopItems(params),
    );
    ipcMain.handle("sale:insertItem", (_, params: SaleItem) =>
      this.insertItem(params),
    );
    ipcMain.handle("sale:placeOrder", (_, params: PlaceOrderType) =>
      this.placeOrder(params),
    );
    ipcMain.handle(
      "sale:updateStatus",
      (_, params: { id: number; status: SaleType["status"] }) =>
        this.updateStatus(params),
    );
    ipcMain.handle("sale:deleteAllItems", (_, sale_id: number) =>
      this.deleteAllItems(sale_id),
    );
  }
  getAll(params: {
    startDate: string;
    endDate: string;
    pageSize: number;
    cursorId: number;
    userId: number;
    direction?: Direction;
  }): {
    data: SaleType[] | null;
    error: Error | string;
  } {
    const {
      startDate,
      endDate,
      cursorId,
      userId,
      direction = "next",
      pageSize,
    } = params;
    console.log("repo currentId", params);

    try {
      const db = this._database;

      let stmt = `
        SELECT
          *
        FROM
          sales
        WHERE
          user_id = ?
          AND id > ?
          AND
          (? IS FALSE OR created_at >= ?)
          AND
          (? IS FALSE OR created_at <= ?)
        LIMIT ?`;

      if (direction === "prev") {
        stmt = `
        SELECT
          *
        FROM
          sales
        WHERE
          user_id = ?
          AND id > ?
          AND
          (? IS FALSE OR created_at >= ?)
          AND
          (? IS FALSE OR created_at <= ?)
        ORDER BY id DESC
        LIMIT ?`;
      }

      const sales = db
        .prepare(stmt)
        .all(
          userId,
          cursorId,
          startDate,
          startDate,
          endDate,
          endDate,
          pageSize + 1,
        ) as SaleType[];

      // console.log({ sales })

      if (!sales) {
        throw new Error("Sorry no sales");
      }

      return {
        data: sales,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while retrieving the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while  retrieving the product"),
      };
    }
  }

  getByUserId(id: number): {
    data: (SaleType & { items: SaleItemType[] }) | null;
    error: ErrorType;
  } {
    try {
      const stmt = `
                SELECT  si.*, p.price, p.name, p.sku, p.code, i.quantity AS product_quantity
                FROM sale_items AS si
                LEFT JOIN products AS p ON p.id = si.product_id
                LEFT JOIN inventory AS i ON i.product_id = p.id
                WHERE si.user_id = ?;
                `;
      const stmtSale = `
            SELECT s.id, s.sub_total, s.discount, s.total
            FROM sales AS s
            WHERE user_id = ?
            `;
      const transaction = this._database.transaction(() => {
        console.log("transaction start");

        const saleItems = this._database
          .prepare(stmt)
          .all(id) as SaleItemType[];

        let sale = this._database.prepare(stmtSale).get(id) as SaleType;

        console.log("sale get by user ", sale);

        if (!sale) {
          const sale = this.create(id).data;
          console.log("create sale", sale);
          return {
            sale,
            items: saleItems,
          };
        }

        return {
          sale,
          items: saleItems,
        };
      });
      const res = transaction();

      // console.log('sale', sale, saleItems)

      if (res.sale) {
        return {
          data: {
            ...res.sale,
            items: res.items,
          },
          error: "",
        };
      }

      return {
        data: null,
        error: new Error("Something went wrong while retrieving the product."),
      };
    } catch (error) {
      console.log("inside catch", error);
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while retrieving the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while  retrieving the product"),
      };
    }
  }

  getById(id: number): ReturnType {
    const db = this._database;
    try {
      const transaction = db.transaction(() => {
        const sales = db
          .prepare(
            `
          SELECT  s.*, p.amount, p.method
          FROM sales AS s
          LEFT JOIN payments AS p ON p.sale_id = s.id
          WHERE s.id = ?
          `,
          )
          .get(id) as SaleType & { amount: number; method: string };

        const saleItems = db
          .prepare(
            `
            SELECT
              si.*,
              p.name,
              p.code,
              i.id AS inventory_id,
              i.quantity AS inventory_qty,
              SUM(COALESCE(ri.quantity, 0)) AS return_qty,
              (si.quantity - SUM(COALESCE(ri.quantity, 0))) AS available_qty
            FROM
              sale_items si
            LEFT JOIN
              products p ON p.id = si.product_id
            LEFT JOIN
              inventory i ON i.product_id = si.product_id
            LEFT JOIN
              return_items ri ON ri.sale_item_id = si.id
            WHERE
              si.sale_id = ?
            GROUP BY
              si.product_id;
            `,
          )
          .all(id) as SaleItemType[];

        return {
          sales,
          saleItems,
        };
      });

      const res = transaction();

      if (!res) {
        throw new Error("Something went wrong while retrieving the product");
      }

      return {
        data: {
          ...res.sales,
          items: res.saleItems,
        },
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while retrieving the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while  retrieving the product"),
      };
    }
  }

  getRevenue(params: {
    startDate: string;
    endDate: string;
    isQuarterly?: boolean;
  }): {
    data: ReturnRevenueType | null;
    error: ErrorType;
  } {
    const { startDate, endDate, isQuarterly = false } = params;
    const db = this._database;
    try {
      const stmt = `
        SELECT
          STRFTIME('%m',  s.created_at) AS month,
          s.gross_revenue,
          r.total_return,
          s.gross_revenue - r.total_return AS net_revenue
        FROM (
          SELECT
            created_at,
            SUM(COALESCE(total, 0)) AS gross_revenue
          FROM
            sales
          WHERE
              created_at >= ?
              AND
              created_at <= ?
              AND status = 'complete'
        ) AS s,
        (
          SELECT
            SUM(COALESCE(refund_amount, 0))  AS total_return
          FROM
            returns
          WHERE
              created_at >= ?
              AND
              created_at <= ?
        ) AS r        `;

      if (isQuarterly) {
        const res = db
          .prepare(stmt)
          .all(startDate, endDate, startDate, endDate) as ReturnRevenueType;

        if (!res) {
          throw new Error("Something went wrong while  retrieving");
        }

        return {
          data: res,
          error: "",
        };
      } else {
        const res = db
          .prepare(stmt)
          .get(startDate, endDate, startDate, endDate) as ReturnRevenueType;
        if (!res) {
          throw new Error("Something went wrong while  retrieving");
        }
        return {
          data: res,
          error: "",
        };
      }
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while retrieving "),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while retrieving"),
      };
    }
  }

  getTopItems(params: {
    pageSize: number;
    cursorId: number;
    lastTotal: number;
    startDate: string;
    endDate: string;
    direction?: Direction;
  }): {
    data: TopItemsType[] | null;
    error: ErrorType;
  } {
    const {
      pageSize,
      //  cursorId,
      //   lastTotal,
      startDate,
      endDate,
    } = params;
    try {
      console.log("params", params);

      const stmt = `
      SELECT
        p.id,
        p.name,
        SUM(si.quantity) - COALESCE(ri.return_qty, 0) AS net_quantity_sold
      FROM sale_items si
      JOIN sales s
        ON s.id = si.sale_id
      JOIN products p
        ON p.id = si.product_id
      LEFT JOIN (
        SELECT
            ri.sale_item_id,
            SUM(ri.quantity) AS return_qty
        FROM return_items ri
        WHERE
          (? IS FALSE OR ri.created_at >= ? )
          AND (? IS FALSE OR ri.created_at <= ?)
        GROUP BY ri.sale_item_id
      ) ri
          ON ri.sale_item_id = si.id
      WHERE
        s.status = 'complete'
        AND
          (? IS FALSE OR si.created_at >= ?  )
          AND (? IS FALSE OR si.created_at <= ?)
      GROUP BY p.id, p.name
      HAVING
        SUM(si.quantity) - COALESCE(SUM(ri.return_qty), 0) > 0
      ORDER BY net_quantity_sold DESC
      LIMIT ?;
      `;
      const products = this._database
        .prepare(stmt)
        .all(
          startDate,
          startDate,
          endDate,
          endDate,
          startDate,
          startDate,
          endDate,
          endDate,
          pageSize,
        ) as TopItemsType[];

      console.log(products);

      if (!products) {
        throw new Error("");
      }

      return {
        data: products,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        console.log(error);

        return {
          data: null,
          error: new Error("Something went wrong while retrieving the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while  retrieving the product"),
      };
    }
  }

  create(user_id: number): { data: SaleType | null; error: ErrorType } {
    const createdAt = new Date().toISOString();
    const db = this._database;
    try {
      const stmt = db.prepare(`
        INSERT INTO sales (created_at, status, user_id)
        VALUES(?, ?, ?)
        RETURNING id
        `);

      const sale = stmt.get(createdAt, "in-progress", user_id) as SaleType;

      if (!sale.id) {
        throw new Error("Something went wrong while creating a sale");
      }

      return {
        data: sale,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while creating a sale"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while creating a sale"),
      };
    }
  }

  placeOrder(params: PlaceOrderType): {
    data: Pick<SaleType, "id"> | null;
    error: Error | string;
  } {
    const { cart, amount, reference_number, method, user_id, customer_name } =
      params;
    const createdAt = new Date().toISOString();
    const db = this._database;

    try {
      const stmtSale = db.prepare(
        `
          UPDATE sales
          SET status = ?,
          invoice_number = ?,
          sub_total = ?,
          discount = ?,
          vatable_sales = ?,
          vat_amount = ?,
          total = ?,
          customer_name = ?
          WHERE id = ?
          `,
      );

      const saleItemsStmt = db.prepare(`
            INSERT INTO
              sale_items
              (created_at, quantity, unit_price, unit_cost, line_total, sale_id, product_id, user_id)
            VALUES(?, ?, ?, ?, ?, ?, ?, ?)
            `);

      const invStmt = db.prepare(
        `
            UPDATE inventory
            SET quantity = quantity - ?
            WHERE product_id = ?
            `,
      );

      const invMovStmt = db.prepare(
        `INSERT INTO
          inventory_movement
          (created_at, movement_type, reference_type, quantity, reference_id, product_id, user_id)
          VALUES(?, ?, ?, ?, ?, ?, ?)
          `,
      );

      const paymentStmt = db.prepare(
        `
          INSERT INTO
            payments
            (created_at, amount, reference_number, method, sale_id)
          VALUES(?, ?, ?, ?, ?)
          `,
      );

      const transaction = db.transaction(() => {
        console.log("place order start", params);

        const saleId = this.create(user_id).data?.id;

        if (!saleId) {
          return false;
        }

        const invoiceNo = String(saleId).padStart(8, "0");

        stmtSale.run(
          "complete",
          invoiceNo,
          cart.sub_total,
          cart.discount,
          cart.vatable_sales,
          cart.vat_amount,
          cart.total,
          customer_name,
          saleId,
        );

        for (const item of cart.items) {
          const line_total = item.quantity * item.price;

          saleItemsStmt.run(
            createdAt,
            item.quantity,
            item.price,
            item.cost,
            line_total,
            saleId,
            item.product_id,
            item.user_id,
          );

          invStmt.run(item.quantity, item.product_id);
          invMovStmt.run(
            createdAt,
            1,
            "sales",
            item.quantity * -1,
            saleId,
            item.product_id,
            item.user_id,
          );
        }

        console.log("after loop");

        const normalizeAmount = amount * 100;

        paymentStmt.run(
          createdAt,
          normalizeAmount,
          reference_number,
          method,
          saleId,
        );

        return saleId;
      });

      const res = transaction();

      console.log("res transaction", res);

      if (!res) {
        throw new Error(
          "Something went wrong while creating an item the product",
        );
      }

      return {
        data: {
          id: res,
        },
        error: "",
      };
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while creating a sale"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while creating a sale"),
      };
    }
  }

  insertItem(params: SaleItem): {
    data:
      | (Pick<SaleType, "id" | "sub_total" | "discount" | "total"> & {
          items: SaleItemType[];
        })
      | null;
    error: ErrorType;
  } {
    const { sale_id, product_id, user_id } = params;
    try {
      let saleId = sale_id;

      const db = this._database;
      const transaction = db.transaction(() => {
        if (!sale_id) {
          const sale = this.create(user_id).data;
          if (sale) {
            saleId = sale.id;
          }
        }

        const foundItem = db
          .prepare(
            `
          SELECT si.*, i.quantity AS product_quantity
          FROM sale_items AS si
          LEFT JOIN inventory AS i ON si.product_id = i.product_id
          WHERE si.product_id = ?;
          `,
          )
          .get(product_id) as SaleItemType;

        // check if product is in the sale items
        // then update the sale item's quantity if not exceed to product's quantity

        console.log({ foundItem });

        if (foundItem) {
          if (foundItem.quantity >= foundItem.product_quantity) {
            throw new Error("You cannot add more to this product");
          }

          db.prepare(
            `
            UPDATE sale_items
            SET quantity = quantity + 1
            WHERE id = ?
            `,
          ).run(foundItem.id);
        } else {
          db.prepare(
            `
            INSERT INTO sale_items (quantity, sale_id, product_id, user_id)
            VALUES(1, ?, ?, ?)
            `,
          ).run(saleId, product_id, user_id);
        }

        // select all items
        // calculate the subtotal, discount, and total

        const items = db
          .prepare(
            `SELECT *
            FROM sale_items AS si
            LEFT JOIN products AS p ON p.id = si.product_id
            WHERE sale_id = ?`,
          )
          .all(saleId) as SaleItemType[];

        console.log("from insert", { items });

        const subTotal = items?.reduce(
          (acc, cur) => (acc += cur.quantity * cur.price),
          0,
        );

        const saleDiscount = db
          .prepare(
            `SELECT discount
          FROM sales
          WHERE id = ?
          `,
          )
          .get(saleId) as SaleType;

        console.log("discount", saleDiscount, subTotal);

        const total = (subTotal || 0) - (saleDiscount.discount ?? 0);

        console.log("total", total);

        db.prepare(
          `UPDATE sales
          SET sub_total = ?,
          total = ?
          WHERE id = ?`,
        ).run(subTotal, total, saleId);

        console.log("done inserting");

        return {
          data: {
            id: saleId,
            items: items,
            sub_total: subTotal,
            discount: saleDiscount.discount,
            total,
          },
          error: "",
        };
      });

      const res = transaction();

      if (!res) {
        throw new Error(
          "Something went wrong while creating an item the product",
        );
      }

      return {
        data: res.data,
        error: "",
      };
    } catch (error) {
      console.log("error insert ", error);

      if (error instanceof Error) {
        return {
          data: null,
          error: new Error(
            error.message ??
              "Something went wrong while creating an item the product",
          ),
        };
      }
      return {
        data: null,
        error: new Error(
          "Something went wrong while creating an item the product",
        ),
      };
    }
  }

  updateStatus(params: { id: number; status: SaleType["status"] }): {
    success: boolean;
    error: ErrorType;
  } {
    const { id, status } = params;
    try {
      const db = this._database;
      const stmt = db.prepare(`
        UPDATE sales
        SET status = ?
        WHERE id = ?
        RETURNING id
      `);

      const itemStmt = db.prepare(
        `
            SELECT si.id, si.product_id, si.quantity, i.id AS inventory_id, i.quantity AS old_quantity
            FROM sale_items si
            LEFT JOIN inventory i ON si.product_id = i.product_id
            WHERE si.sale_id = ?
            `,
      );

      const transaction = db.transaction(() => {
        const sales = stmt.run(status, id);

        const items = itemStmt.all(id) as Array<
          SaleItemType & { old_quantity: number }
        >;

        const isVoid = status === "void";

        let referenceType: InventoryType["reference_type"] | undefined;

        switch (status) {
          case "void":
            referenceType = "void";
            break;
          case "return":
            referenceType = "return";
            break;
          default:
            referenceType = "sale";
            break;
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          const resItem = this._inventory.update({
            quantity: !isVoid ? item.quantity * -1 : item.quantity,
            id: item.inventory_id,
            product_id: item.product_id,
            user_id: item.user_id,
            movement_type: isVoid ? 0 : 1,
            reference_type: referenceType,
          });

          if (!resItem) {
            throw new Error("Something went wrong while updating the sale");
          }
        }

        if (!sales) {
          throw new Error("Something went wrong while updating the sale");
        }
        return true;
      });
      transaction();

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: new Error(
            error.message ??
              "Something went wrong while deleting an item the product",
          ),
        };
      }
      return {
        success: false,
        error: new Error(
          "Something went wrong while deleting an item the product",
        ),
      };
    }
  }

  deleteAllItems(saleId: number): { success: boolean; error: Error | string } {
    try {
      const transaction = this._database.transaction(() => {
        this._database
          .prepare(
            `DELETE FROM sale_items
        WHERE sale_id = ?`,
          )
          .run(saleId);

        this._database
          .prepare(
            `UPDATE sales
          SET discount = 0,
          sub_total = 0,
          total = 0
          WHERE id = ?
          `,
          )
          .run(saleId);
      });

      transaction();

      return {
        success: true,
        error: new Error("Something went wrong while deleting the sale"),
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: new Error(
            error.message ??
              "Something went wrong while deleting an item the product",
          ),
        };
      }
      return {
        success: false,
        error: new Error(
          "Something went wrong while deleting an item the product",
        ),
      };
    }
  }
}
