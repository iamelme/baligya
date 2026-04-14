import { IInventoryRepository } from "../interfaces/IInventoryRepository";
import {
  SaleItem,
  ISaleRepository,
  ReturnType,
  Direction,
  TopItemsType,
  GetAllParams,
  ReturnAllType,
  PaymentParams,
} from "../interfaces/ISaleRepository";
import {
  ErrorType,
  PlaceOrderType,
  ReturnRevenueType,
  SaleItemType,
  SaleType,
  ReturnType as ReturnsType,
  ReturnItemType,
  ReturnSaleType,
  PaymentType,
} from "../../renderer/src/shared/utils/types";
import { ipcMain } from "electron";
import { AppDatabase } from "../database/db";
import { errorMapper } from "../utils";

export class SaleRepository implements ISaleRepository {
  private _database: AppDatabase;
  private _inventory: IInventoryRepository;

  constructor(database: AppDatabase, inventory: IInventoryRepository) {
    this._database = database;
    this._inventory = inventory;
    ipcMain.handle("sale:getAll", (_, params: GetAllParams) =>
      this.getAll(params),
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
    ipcMain.handle("sale:pay", (_, params: PaymentParams) => this.pay(params));
  }

  pay(params: PaymentParams): {
    success: boolean;
    error: ErrorType;
  } {
    const { id, amount, refNo = "", method = "cash" } = params;

    const db = this._database.getDb();
    const stmtPay = db.prepare(
      `
      INSERT INTO payments (amount, reference_number, method, sale_id)
      VALUES(?, ?, ?, ?)
      `,
    );

    const stmtSale = db.prepare(
      `
      SELECT
        s.total,
        COALESCE(SUM(p.amount), 0) AS amount
      FROM
        sales AS s
      LEFT JOIN (
        SELECT
          sale_id,
          amount
        FROM
          payments
      ) AS p
      ON
        p.sale_id = s.id
      WHERE
        s.id = ?
      `,
    );

    const normalizeAmount = amount * 100;
    try {
      const transaction = db.transaction(() => {
        const { total, amount: amount_paid } = stmtSale.get(
          id,
        ) as ReturnSaleType;

        const totalPaid = amount_paid + normalizeAmount;

        console.log({ total, totalPaid });

        stmtPay.run(normalizeAmount, refNo, method, id);
        if (totalPaid >= total) {
          this.updateStatus({ id, status: "complete" });
        } else if (total >= totalPaid) {
          this.updateStatus({ id, status: "partial_paid" });
        }
      });

      transaction();

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      return {
        success: false,
        error: errorMapper(error),
      };
    }
  }

  getAll(params: GetAllParams): ReturnAllType {
    const { pageSize, offset } = params;

    // console.log({ params });

    const db = this._database.getDb();

    try {
      const stmt = db.prepare(`
         SELECT
          *
         FROM
          sales
         WHERE
          (:startDate IS FALSE OR created_at >= :startDate )
          AND (:endDate IS FALSE OR created_at <= :endDate )
         LIMIT :limit
         OFFSET :offset
        `);

      const stmtCount = db.prepare(`
          SELECT
            count
          FROM
            counter
          WHERE
            name = :name
                                    `);

      const transaction = db.transaction(() => {
        const sales = stmt.all({
          ...params,
          limit: pageSize,
          offset: offset ? offset * pageSize : offset,
        }) as SaleType[];

        if (!sales) {
          throw new Error("Sorry no sales");
        }

        const total = stmtCount.get({ name: "sales" }) as { count: number };

        return {
          total: total?.count || 0,
          results: sales,
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
          error: new Error("Something went wrong while retrieving the product"),
        };
      }
      return {
        data: {
          total: 0,
          results: null,
        },
        error: new Error("Something went wrong while  retrieving the product"),
      };
    }
  }

  getByUserId(id: number): {
    data: (SaleType & { items: SaleItemType[] }) | null;
    error: ErrorType;
  } {
    try {
      const db = this._database.getDb();
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
      const transaction = db.transaction(() => {
        console.log("transaction start");

        const saleItems = db.prepare(stmt).all(id) as SaleItemType[];

        let sale = db.prepare(stmtSale).get(id) as SaleType;

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
    const db = this._database.getDb();
    try {
      const stmsSale = db.prepare(
        `
          SELECT
            s.*,
            COALESCE(p.amount, 0) AS amount,
            p.method,
            r.amount AS return_amount
          FROM
            sales AS s
          LEFT JOIN (
            SELECT
              sale_id,
              method,
              SUM(amount) AS amount
            FROM
              payments
            GROUP BY
              sale_id
          ) AS p
          ON
            p.sale_id = s.id
          LEFT JOIN (
            SELECT
              sale_id,
              amount
            FROM
              returns
          ) AS r
          ON
            r.sale_id = s.id
          WHERE
            s.id = ?
          `,
      );

      const stmtSaleItems = db.prepare(
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
      );

      const stmtPayments = db.prepare(
        `
        SELECT
          *
        FROM
          payments
        WHERE
          sale_id = ?
          AND
          amount > 0
        `,
      );

      const stmtReturn = db.prepare(
        `
        SELECT
          *
        FROM
          returns
        WHERE
          sale_id = ?
        `,
      );

      const transaction = db.transaction(() => {
        const sales = stmsSale.get(id) as SaleType & {
          amount: number;
          method: string;
        };

        const saleItems = stmtSaleItems.all(id) as Array<
          SaleItemType & {
            disposition: ReturnItemType["disposition"];
          }
        >;

        const payments = stmtPayments.all(id) as PaymentType[];

        const returns = stmtReturn.all(id) as ReturnsType[];

        return {
          sales,
          saleItems,
          payments,
          returns,
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
          payments: res.payments,
          returns: res.returns,
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
    const db = this._database.getDb();
    try {
      // const stmt = `
      //   SELECT
      //     STRFTIME('%m', s.created_at) AS month,
      //     COALESCE(p.prev_gross_revenue, 0) AS prev_gross_revenue,
      //     s.gross_revenue,
      //     COALESCE(pr.prev_total_return, 0) as prev_total_return,
      //     COALESCE(r.total_return, 0) as total_return,
      //     s.gross_revenue - COALESCE(r.total_return, 0) AS net_revenue
      //   FROM (
      //     SELECT
      //       created_at,
      //       SUM(COALESCE(total, 0)) AS gross_revenue
      //     FROM
      //       sales
      //     WHERE
      //         created_at >= :startDate
      //         AND
      //         created_at <= :endDate
      //         AND status != 'void'
      //   ) AS s,
      //   (
      //     SELECT
      //       created_at,
      //       SUM(COALESCE(total, 0)) AS prev_gross_revenue
      //     FROM
      //       sales
      //     WHERE
      //       created_at = STRFTIME('%m', :startDate , '-1 month')
      //       AND status != 'void'
      //   ) AS p,
      //   (
      //     SELECT
      //       SUM(COALESCE(amount, 0))  AS total_return
      //     FROM
      //       returns
      //     WHERE
      //         created_at >= :startDate
      //         AND
      //         created_at <= :endDate
      //   ) AS r,
      //   (
      //     SELECT
      //       SUM(COALESCE(amount, 0))  AS prev_total_return
      //     FROM
      //       returns
      //     WHERE
      //       created_at = STRFTIME('%m', :startDate , '-1 month')
      //   ) AS pr;
      //         `;

      const stmt = `
      WITH
sales_summary AS (
SELECT
    created_at,
    STRFTIME('%m', created_at) AS month,
    SUM(amount) AS gross_revenue
  FROM
    payments
 WHERE
		created_at >=
			STRFTIME('%m', :startDate, '-1 month')
		AND
			created_at  <= :endDate
  GROUP BY month
),

sales_with_lag AS (
  SELECT
	created_at,
    month,
    gross_revenue,
    LAG(gross_revenue) OVER (ORDER BY month) AS prev_gross_revenue
  FROM
	sales_summary
),

returns_summary AS (
	SELECT
		created_at,
    STRFTIME('%m', created_at) AS month,
		SUM(amount) AS total_return
	FROM
		returns
		WHERE
    method != 'credit_memo'
    AND
	created_at >=
			STRFTIME('%m', :startDate, '-1 month')
		AND
			created_at  <= :endDate
  GROUP BY month
),

returns_with_lag AS (
	SELECT
		created_at,
		month,
    total_return,
		LAG(total_return) OVER (ORDER BY month) AS prev_total_return
	FROM
		returns_summary
	GROUP BY
		month
)


SELECT
  s.*,
  COALESCE(r.total_return, 0) AS total_return,
  s.gross_revenue - COALESCE(r.total_return, 0) AS net_revenue,
  COALESCE(r.prev_total_return, 0) AS prev_total_return,
  COALESCE(
    ROUND(
        (s.gross_revenue - COALESCE(r.total_return, 0) - (COALESCE(s.prev_gross_revenue, 0) - COALESCE(r.prev_total_return, 0))) * 100.0 /
        (COALESCE(s.prev_gross_revenue, 0) - COALESCE(r.prev_total_return, 0)),
        2
    ), 0
  ) AS net_percent_change,
  COALESCE(
  ROUND(
      (COALESCE(r.total_return, 0) - COALESCE(r.prev_total_return, 0)) * 100.0 /
      COALESCE(r.prev_total_return, 0),
      2
    ), 0
  ) AS return_percent_change,
  COALESCE(
    ROUND(
        (s.gross_revenue - COALESCE(s.prev_gross_revenue, 0)) * 100.0 /
        s.prev_gross_revenue,
        2
    ), 0
  ) AS gross_percent_change
FROM sales_with_lag AS s
LEFT JOIN
  returns_with_lag AS r
  ON
  s.month = r.month
WHERE
	s.created_at >=
			:startDate
		AND
			s.created_at  <= :endDate


      `;

      console.log({ startDate, endDate });

      if (isQuarterly) {
        const res = db
          .prepare(stmt)
          // .all(startDate, endDate,startDate, startDate, endDate,  startDate) as ReturnRevenueType;
          .all({ startDate, endDate }) as ReturnRevenueType;

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
          // .get(startDate, endDate,startDate, startDate, endDate,  startDate) as ReturnRevenueType;
          .get({ startDate, endDate }) as ReturnRevenueType;

        if (!res) {
          return {
            data: null,
            error: "",
          };
        }
        // if (!res) {
        //   throw new Error("Something went wrong while  retrieving");
        // }
        return {
          data: res,
          error: "",
        };
      }
    } catch (error) {
      console.log(error);
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

      const db = this._database.getDb();
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
      const products = db
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
    const db = this._database.getDb();
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
    const {
      items,
      sub_total,
      discount,
      vatable_sales,
      vat_amount,
      total,

      amount,
      reference_number,
      method,
      sales_order_id,
      user_id,
      customer_name,
      bill_to = "",
      ship_to = "",
      notes = "",
      status = "complete",
    } = params;
    const createdAt = new Date().toISOString();
    const db = this._database.getDb();

    try {
      const stmtSale = db.prepare(
        `
          UPDATE
            sales
          SET
            status = ?,
            invoice_number = ?,
            sub_total = ?,
            discount = ?,
            vatable_sales = ?,
            vat_amount = ?,
            total = ?,
            customer_name = ?,
            bill_to = ?,
            ship_to = ?,
            notes = ?,
            sales_order_id = ?
          WHERE
            id = ?
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
            UPDATE
              inventory
            SET
              quantity = quantity - ?
            WHERE
              product_id = ?
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
          status,
          invoiceNo,
          sub_total,
          discount,
          vatable_sales,
          vat_amount,
          total,
          customer_name,
          bill_to,
          ship_to,
          notes,
          sales_order_id,
          saleId,
        );

        for (const item of items) {
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

      const db = this._database.getDb();
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
      const db = this._database.getDb();
      const stmt = db.prepare(`
        UPDATE
          sales
        SET
          status = :status,
          sub_total = :sub_total,
          discount = :discount,
          total = :total
        WHERE
          id = :id
        RETURNING id
      `);

      const stmtSale = db.prepare(
        `
        SELECT
          sub_total,
          discount,
          total
        FROM
          sales
        WHERE
          id = ?
        `,
      );

      const itemStmt = db.prepare(
        `
        SELECT
          si.id,
          si.product_id,
          si.quantity,
          si.unit_price,
          i.id AS inventory_id,
          SUM(COALESCE(ri.quantity, 0)) AS return_qty
        FROM
          sale_items AS si
        LEFT JOIN
          inventory AS i
        ON
          si.product_id = i.product_id
        LEFT JOIN (
            SELECT
              sale_item_id,
              quantity
            FROM
              return_items
        ) AS ri
        ON
          ri.sale_item_id = si.id
        WHERE
          si.sale_id = ?
        GROUP BY
          si.product_id
        `,
      );

      const transaction = db.transaction(() => {
        console.log("status to be updated", status);

        const sale = stmtSale.get(id) as SaleType;

        let subTotal = sale.sub_total || 0,
          discount = sale.discount || 0,
          total = sale.total || 0;

        const items = itemStmt.all(id) as Array<SaleItemType>;
        if (status === "void") {
          for (const item of items) {
            const resItem = this._inventory.update({
              quantity: item.quantity,
              id: item.inventory_id,
              product_id: item.product_id,
              user_id: item.user_id,
              movement_type: 0,
              reference_type: "void",
            });

            if (!resItem) {
              throw new Error("Something went wrong while updating the sale");
            }
          }
        } else if (status === "partial_return" || status === "return") {
          // let temp = 0;
          // for (const item of items) {
          //   console.log({ item });
          //   const finalQty = item.quantity - item.return_qty;
          //   temp += finalQty * item.unit_price;
          // }
          // subTotal = temp;
        }

        // total = subTotal - discount;

        const sales = stmt.run({
          status,
          sub_total: subTotal,
          discount,
          total,
          id,
        });

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
      const db = this._database.getDb();
      const transaction = db.transaction(() => {
        db.prepare(
          `DELETE FROM sale_items
        WHERE sale_id = ?`,
        ).run(saleId);

        db.prepare(
          `UPDATE sales
          SET discount = 0,
          sub_total = 0,
          total = 0
          WHERE id = ?
          `,
        ).run(saleId);
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
