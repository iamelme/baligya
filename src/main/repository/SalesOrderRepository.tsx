import { SqliteError } from "better-sqlite3";
import {
  SalesOrderItemType,
  SalesOrderType,
} from "@renderer/shared/utils/types";
import { AppDatabase } from "../database/db";
import {
  CreateSalesOrderParams,
  InsertSalesOrderItemsParams,
  ISalesOrderRepository,
  ReturnAllSalesOrderItemType,
  ReturnAllSalesOrderType,
  ReturnSalesOrderType,
  UpdateSalesOrderItemsParams,
  UpdateSalesOrderParams,
} from "../interfaces/ISalesOrderRepository";
import { ipcMain } from "electron/main";
import { errorMapper } from "../utils";

export class SalesOrderRepository implements ISalesOrderRepository {
  _database: AppDatabase;
  constructor(database: AppDatabase) {
    this._database = database;
    ipcMain.handle("salesOrder:create", (_, params: CreateSalesOrderParams) =>
      this.create(params),
    );
    ipcMain.handle(
      "salesOrder:insertItem",
      (_, params: InsertSalesOrderItemsParams) => this.insertItem(params),
    );
    ipcMain.handle("salesOrder:update", (_, params: UpdateSalesOrderParams) =>
      this.update(params),
    );
    ipcMain.handle("salesOrder:getAll", (_) => this.getAll());
    ipcMain.handle("salesOrder:getById", (_, id: number) => this.getById(id));
  }

  deleteItem(id: number): { success: boolean; error: Error | string } {
    try {
      const db = this._database.getDb();

      const stmt = db.prepare(
        `
        DELETE FROM
          sales_order_items
        WHERE
          id = ?
        `,
      );

      console.log(stmt);

      const transaction = db.transaction(() => {
        const item = stmt.run(id);

        console.log(item);

        if (!item.changes) {
          throw new Error(
            "Something went wrong while deleting the sales order",
          );
        }

        return true;
      });

      transaction();

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.log("delete item", error);
      console.error(
        "error ==>",
        error instanceof SqliteError,
        error instanceof Error,
      );

      return {
        success: false,
        error: errorMapper(error),
      };
    }
  }

  getAllItems(salesOrderId: number): ReturnAllSalesOrderItemType {
    {
      console.log(salesOrderId);
      try {
        const db = this._database.getDb();

        const stmt = db.prepare(
          `
        SELECT
          *
        FROM
          sales_order_items
        WHERE
          sales_order_id = ?
        `,
        );

        const transaction = db.transaction(() => {
          const salesOrderItems = stmt.all() as SalesOrderItemType[];

          if (!salesOrderItems) {
            throw new Error(
              "Something went wrong while retrieving the sales order.",
            );
          }

          return {
            total: 0,
            results: salesOrderItems,
          };
        });

        const res = transaction();

        return {
          data: res,
          error: "",
        };
      } catch (error) {
        console.log(error);
        return {
          data: {
            total: 0,
            results: null,
          },
          error: errorMapper(error),
        };
      }
    }
  }

  updateItem(params: UpdateSalesOrderItemsParams): {
    success: boolean;
    error: Error | string;
  } {
    const { id, quantity, unit_cost, unit_price, discount, product_id } =
      params;
    console.log("update item", { params });
    try {
      const db = this._database.getDb();

      const line_total = (quantity || 1) * (unit_price || 0);

      const salesOrderItem = db
        .prepare(
          `
          UPDATE
            sales_order_items
          SET
            quantity = ?,
            unit_cost = ?,
            unit_price = ?,
            discount = ?,
            line_total = ?,
            product_id = ?
          WHERE
            id = ?
        `,
        )
        .run(
          quantity,
          unit_cost,
          unit_price,
          discount,
          line_total,
          product_id,
          id,
        );
      console.log({ salesOrderItem });

      if (!salesOrderItem.changes) {
        throw new Error("Something went wrong while saving the sales order");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.log("update item", error);
      return { success: false, error: errorMapper(error) };
    }
  }

  update(params: UpdateSalesOrderParams): {
    success: boolean;
    error: Error | string;
  } {
    const {
      id,
      status,
      // due_at,
      user_id,
      // customer_id,
      discount,
      // vatable_sales,
      // vat_amount,
      // tax,
      // notes,
      items,
    } = params;
    try {
      console.log({ params });
      const db = this._database.getDb();

      const stmt = db.prepare(
        `
        SELECT
          *
        FROM
          sales_order
        WHERE
          id = ?
        `,
      );

      const stmtSalesOrder = db.prepare(
        `
        UPDATE
          sales_order
        SET
           due_at = :due_at,
           status = :status,
           user_id = :user_id ,
           customer_id = :customer_id,
           sub_total = :sub_total,
           discount = :discount,
           total = :total,
           vatable_sales = :vatable_sales,
           vat_amount = :vat_amount,
           tax = :tax,
           notes = :notes
        WHERE
           id = :id
        `,
      );

      const stmtSalesOrderStatus = db.prepare(
        `
        UPDATE
          sales_order
        SET
          status = ?
        WHERE
          id = ?
        `,
      );

      const stmtItems = db.prepare(
        `
        SELECT
          *
        FROM
          sales_order_items
        WHERE
          sales_order_id = ?
        `,
      );

      const transaction = db.transaction(() => {
        const salesOrderSelect = stmt.get(id) as SalesOrderType;

        if (!salesOrderSelect) {
          throw new Error("Order not found");
        }
        //on this point user can only change status

        console.log(" salesOrderSelect", salesOrderSelect);

        if (
          ["fulfilled", "complete", "cancelled"].find(
            (s) => s === salesOrderSelect.status,
          )
        ) {
          const salesOrder = stmtSalesOrderStatus.run(status, id);

          if (!salesOrder.changes) {
            throw new Error(
              "Something went wrong while updating the sales order",
            );
          }
          return true;
        }

        const subTotal = items?.reduce(
          (acc, cur) => (acc += (cur.quantity || 0) * cur.unit_price),
          0,
        );
        const total = subTotal - discount;

        const salesOrder = stmtSalesOrder.run({
          ...params,
          sub_total: subTotal,
          total,
        });

        // const salesOrder = stmtSalesOrder.run(
        //   due_at,
        //   status,
        //   user_id,
        //   customer_id,
        //   subTotal,
        //   discount,
        //   total,
        //   vatable_sales,
        //   vat_amount,
        //   tax,
        //   notes,
        //   id,
        // );

        if (!salesOrder.changes) {
          throw new Error(
            "Something went wrong while updating the sales order",
          );
        }

        const salesOrderItems = stmtItems.all(id) as SalesOrderItemType[];

        if (!salesOrderItems) {
          throw new Error(
            "Something went wrong while updating the sales order",
          );
        }

        console.log("update salesOrderItems ", salesOrderItems);

        if (items.length < salesOrderItems.length) {
          for (const item of salesOrderItems) {
            const found = items?.find((i) => i.id === item.id);

            if (!found) {
              const { error } = this.deleteItem(item.id);
              if (error instanceof Error) {
                throw new Error(error.message);
              }
              continue;
            }
            const { error } = this.updateItem(item);

            if (error instanceof Error) {
              throw new Error(error.message);
            }
          }
        } else {
          for (const item of items) {
            const found = salesOrderItems?.find((i) => i.id === item.id);
            if (found) {
              const { error } = this.updateItem(item);

              if (error instanceof Error) {
                throw new Error(error.message);
              }
            } else {
              const { error } = this.insertItem({
                ...item,
                user_id,
                sales_order_id: id,
              });

              if (error instanceof Error) {
                throw new Error(error.message);
              }
            }
          }
        }

        return true;
      });

      const res = transaction();

      if (!res) {
        throw new Error("Something went wrong while updating the sales order");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.log("update", error);
      return { success: false, error: errorMapper(error) };
    }
  }

  getAll(): ReturnAllSalesOrderType {
    try {
      const db = this._database.getDb();

      const stmt = db.prepare(
        `
        SELECT
          so.*,
          c.name AS customer_name
        FROM
          sales_order AS so
        LEFT JOIN
          customers AS c
        ON
          c.id = so.customer_id
        `,
      );

      const transaction = db.transaction(() => {
        const salesOrders = stmt.all() as Array<
          SalesOrderType & { customer_name: string }
        >;

        if (!salesOrders) {
          throw new Error(
            "Something went wrong while retrieving the sales order.",
          );
        }

        return {
          total: 0,
          results: salesOrders,
        };
      });

      const res = transaction();

      return {
        data: res,
        error: "",
      };
    } catch (error) {
      console.log(error);
      return {
        data: {
          total: 0,
          results: null,
        },
        error: errorMapper(error),
      };
    }
  }

  getById(id: number): ReturnSalesOrderType {
    try {
      const db = this._database.getDb();

      const stmt = db.prepare(
        `
        SELECT
          so.*,
          c.name AS customer_name
        FROM
          sales_order AS so
        LEFT JOIN
          customers AS c
        ON
          c.id = so.customer_id
        WHERE
          so.id = ?
        `,
      );

      const stmtItems = db.prepare(
        `
        SELECT
          soi.*,
          p.name AS product_name,
          p.description AS product_desc
        FROM
          sales_order_items AS soi
        LEFT JOIN
          products AS p
        ON
          p.id = soi.product_id
        WHERE
          soi.sales_order_id = ?
        `,
      );

      const transaction = db.transaction(() => {
        const salesOrder = stmt.get(id) as SalesOrderType;

        if (!salesOrder.id) {
          throw new Error(
            "Something went wrong while retrieving the sales order.",
          );
        }

        const salesOrderItems = stmtItems.all(id) as Array<
          SalesOrderItemType & { product_name: string; product_desc: string }
        >;

        return {
          ...salesOrder,
          items: salesOrderItems,
        };
      });

      const res = transaction();
      return {
        data: res,
        error: "Something went wrong while retrieving the sales order",
      };
    } catch (error) {
      console.log(error);
      return {
        data: null,
        error: errorMapper(error),
      };
    }
  }

  insertItem(params: InsertSalesOrderItemsParams): {
    success: boolean;
    error: Error | string;
  } {
    const {
      user_id,
      quantity,
      unit_cost,
      unit_price,
      discount,
      line_total,
      product_id,
      sales_order_id,
    } = params;
    console.log("insert items", { params });
    try {
      const db = this._database.getDb();

      const createdAt = new Date().toISOString();

      const salesOrderItem = db
        .prepare(
          `
        INSERT INTO
          sales_order_items
        (
          created_at,
          user_id,
          quantity,
          unit_cost,
          unit_price,
          discount,
          line_total,
          product_id,
          sales_order_id
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        )
        .run(
          createdAt,
          user_id,
          quantity,
          unit_cost,
          unit_price,
          discount,
          line_total,
          product_id,
          sales_order_id,
        );

      if (!salesOrderItem.changes) {
        throw new Error("Something went wrong while saving the sales order");
      }

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

  create(params: CreateSalesOrderParams): {
    success: boolean;
    error: Error | string;
  } {
    const {
      due_at,
      user_id,
      customer_id,
      discount,
      vatable_sales,
      vat_amount,
      tax,
      notes,
      items,
    } = params;
    try {
      console.log({ params });
      const db = this._database.getDb();

      const createdAt = new Date().toISOString();

      const stmtSalesOrder = db.prepare(
        `
        INSERT INTO
          sales_order
          (
           created_at,
           due_at,
           user_id,
           customer_id,
           sub_total,
           discount,
           total,
           vatable_sales,
           vat_amount,
           tax,
           notes
          )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );

      const transaction = db.transaction(() => {
        const subTotal = items?.reduce(
          (acc, cur) => (acc += (cur.quantity || 0) * cur.unit_price),
          0,
        );
        const total = subTotal - discount;

        const salesOrder = stmtSalesOrder.run(
          createdAt,
          due_at,
          user_id,
          customer_id,
          subTotal,
          discount,
          total,
          vatable_sales,
          vat_amount,
          tax,
          notes,
        );
        console.log("salesOrder", salesOrder);

        if (!salesOrder.changes) {
          throw new Error("Something went wrong while saving the sales order");
        }

        for (const item of items) {
          this.insertItem({
            ...item,
            sales_order_id: salesOrder.lastInsertRowid as number,
            user_id,
          });
        }
        return true;
      });

      const res = transaction();

      if (!res) {
        throw new Error("Something went wrong while saving the sales order");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error: errorMapper(error),
      };
    }
  }
}
