import { SqliteError } from "better-sqlite3";
import {
  SalesOrderItemType,
  SalesOrderType,
} from "@renderer/shared/utils/types";
import { AppDatabase } from "../database/db";
import {
  CreateSalesOrderParams,
  GetAllSalesOrderParams,
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
import { SaleRepository } from "./SaleRepository";

export class SalesOrderRepository implements ISalesOrderRepository {
  _database: AppDatabase;
  private _sales: SaleRepository;

  constructor(database: AppDatabase, sales: SaleRepository) {
    this._database = database;
    this._sales = sales;

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
    ipcMain.handle("salesOrder:getAll", (_, params: GetAllSalesOrderParams) =>
      this.getAll(params),
    );
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
          const salesOrderItems = stmt.all(
            salesOrderId,
          ) as SalesOrderItemType[];

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
    data?: {
      id: number;
    };
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

      const createdAt = new Date().toISOString();

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
           bill_to = :bill_to,
           ship_to = :ship_to,
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

      const stmtInvReseSel = db.prepare(
        `
        SELECT
          *
        FROM
          inventory_reservation
        WHERE
          sales_order_id = ?
          AND
          product_id = ?
        `,
      );

      const stmtInvRese = db.prepare(
        `
            INSERT INTO
              inventory_reservation
              (created_at, quantity, sales_order_id, product_id)
            VALUES(?, ?, ?, ?)
            `,
      );

      const stmtInvResUpdate = db.prepare(
        `
        UPDATE
          inventory_reservation
        SET
          status = :status,
          quantity = :quantity
        WHERE
          sales_order_id = :sales_order_id
          AND
          product_id = :product_id
        `,
      );

      const stmtCust = db.prepare(
        `
        SELECT
          name
        FROM
          customers
        WHERE
          id = ?
        `,
      );

      const transaction = db.transaction(() => {
        const salesOrderSelect = stmt.get(id) as SalesOrderType;

        if (!salesOrderSelect) {
          throw new Error("Order not found");
        }

        if (
          ["complete", "cancelled"].find((s) => s === salesOrderSelect.status)
        ) {
          // const salesOrder = stmtSalesOrderStatus.run(status, id);
          //
          // if (!salesOrder.changes) {
          //   throw new Error(
          //     "Something went wrong while updating the sales order",
          //   );
          // }
          return {
            success: true,
            id: null,
          };
        }

        if (status !== "cancelled") {
          const { success, error } = this.checkDoubleBooking({
            items,
            salesOrderId: id,
          });

          if (!success) {
            throw new Error(error instanceof Error ? error.message : error);
          }
        }

        console.log(" salesOrderSelect", salesOrderSelect);

        if (status === "fulfilled") {
          const salesOrder = stmtSalesOrderStatus.run(status, id);
          if (!salesOrder.changes) {
            throw new Error(
              "Something went wrong while updating the sales order",
            );
          }
        }

        const { vatableSales, vatAmount, subTotal, total } =
          this.calculateTotal(items, discount);
        const salesOrderItems = stmtItems.all(id) as SalesOrderItemType[];

        if (!salesOrderItems) {
          throw new Error(
            "Something went wrong while updating the sales order",
          );
        }

        // if status of the current sales order is fulfilled we only change the status and others cannot
        if (salesOrderSelect.status === "fulfilled") {
          if (status === "complete") {
            console.log("complete", { params });

            const { name: customerName } = stmtCust.get(
              salesOrderSelect.customer_id,
            ) as {
              name: string;
            };

            if (!customerName) {
              throw new Error(
                "Something went wrong while updating the sales order",
              );
            }

            const payload = {
              ...salesOrderSelect,
              customer_name: customerName, // snapshot of the customers name at this time
              items: salesOrderItems?.map((item) => ({
                ...item,
                cost: item.unit_cost,
                price: item.unit_price,
              })),
              sub_total: salesOrderSelect.sub_total,
              discount: salesOrderSelect.discount,
              vatable_sales: vatableSales,
              vat_amount: vatAmount,
              total: salesOrderSelect.total,
              amount: 0,
              reference_number: "",
              method: "",
              sales_order_id: id,
              sale_id: 0,
              status: "unpaid" as const,
            };

            const { data, error } = this._sales.placeOrder(payload);

            if (error instanceof Error) {
              throw new Error(error.message);
            }

            const salesOrder = stmtSalesOrderStatus.run("complete", id);

            if (!salesOrder.changes) {
              throw new Error(
                "Something went wrong while updating the sales order",
              );
            }

            for (const item of items) {
              stmtInvResUpdate.run({
                status: "fulfilled",
                quantity: item.quantity,
                product_id: item.product_id,
                sales_order_id: id,
              });
            }

            if (!data) {
              throw new Error(
                "Something went wrong while updating the sales order",
              );
            }

            return {
              success: true,
              id: data.id,
            };
          }

          return {
            success: true,
            id: null,
          };
        }

        if (status === "cancelled") {
          const salesOrder = stmtSalesOrderStatus.run("cancelled", id);

          if (!salesOrder.changes) {
            throw new Error(
              "Something went wrong while updating the sales order",
            );
          }

          for (const item of salesOrderItems) {
            stmtInvResUpdate.run({
              status: "released",
              quantity: item.quantity,
              product_id: item.product_id,
              sales_order_id: id,
            });
          }

          return {
            success: true,
            id: null,
          };
        }

        const salesOrder = stmtSalesOrder.run({
          ...params,
          sub_total: subTotal,
          total,
        });

        if (!salesOrder.changes) {
          throw new Error(
            "Something went wrong while updating the sales order",
          );
        }

        const hasItemsDeleted = items.length < salesOrderItems.length;

        if (hasItemsDeleted) {
          for (const item of salesOrderItems) {
            const found = items?.find((i) => i.id === item.id);

            if (!found) {
              // delete if item is not found in the current
              const { error } = this.deleteItem(item.id);
              if (error instanceof Error) {
                throw new Error(error.message);
              }

              stmtInvResUpdate.run({
                status: "cancelled", // delete
                quantity: item.quantity,
                product_id: item.product_id,
                sales_order_id: id,
              });

              continue;
            }
            const { error } = this.updateItem(item);
            stmtInvResUpdate.run({
              status: "active",
              quantity: item.quantity,
              product_id: item.product_id,
              sales_order_id: id,
            });

            if (error instanceof Error) {
              throw new Error(error.message);
            }
          }
        } else {
          for (const item of items) {
            const found = salesOrderItems?.find((i) => i.id === item.id);

            const selectInventoryReservation = stmtInvReseSel.get(
              id,
              item.product_id,
            );

            if (!selectInventoryReservation && status === "confirmed") {
              stmtInvRese.run(createdAt, item.quantity, id, item.product_id);
            } else {
              stmtInvResUpdate.run({
                status: "active",
                quantity: item.quantity,
                product_id: item.product_id,
                sales_order_id: id,
              });
            }

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

        return {
          success: true,
          id: null,
        };
      });

      const res = transaction();

      if (!res?.success) {
        throw new Error("Something went wrong while updating the sales order");
      }

      if (res?.id) {
        return {
          success: true,
          data: {
            id: res.id,
          },
          error: "",
        };
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

  getAll(params: GetAllSalesOrderParams): ReturnAllSalesOrderType {
    const { startDate, endDate, pageSize, offset } = params;
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
          (:startDate IS FALSE OR so.created_at >= :startDate )
          AND (:endDate IS FALSE OR so.created_at < :endDate )
        LIMIT :limit
        OFFSET :offset
        `,
      );

      const stmtCount = db.prepare(
        `
          SELECT
            count
          FROM
            counter
          WHERE
            name = :name
        `,
      );

      const stmtCount2 = db.prepare(
        `
        SELECT
          COUNT(id) as count
        FROM
          sales_order
        WHERE
          (:startDate IS FALSE OR created_at >= :startDate )
          AND (:endDate IS FALSE OR created_at < :endDate )
        `,
      );

      const transaction = db.transaction(() => {
        const salesOrders = stmt.all({
          startDate,
          endDate,
          limit: pageSize,
          offset: offset ? offset * pageSize : offset,
        }) as Array<SalesOrderType & { customer_name: string }>;

        if (!salesOrders) {
          throw new Error(
            "Something went wrong while retrieving the sales order.",
          );
        }

        let total = { count: 0 };

        if (startDate || endDate) {
          total = stmtCount2.get({
            startDate,
            endDate,
          }) as {
            count: number;
          };
        } else {
          total = stmtCount.get({ name: "sales-order" }) as {
            count: number;
          };
        }

        return {
          total: total?.count || 0,
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
          p.description AS product_desc,
          p.unit AS product_unit,
          COALESCE((i.quantity - COALESCE(ir.quantity, 0)), 0) + soi.quantity AS available
        FROM
          sales_order_items AS soi
        LEFT JOIN
          products AS p
          ON p.id = soi.product_id
        LEFT JOIN
          inventory AS i
          ON p.id = i.product_id
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
          SalesOrderItemType & {
            product_unit: string;
            product_name: string;
            product_desc: string;
            available: number;
          }
        >;

        return {
          ...salesOrder,
          items: salesOrderItems,
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
    data?: {
      id: number;
    };
    error: Error | string;
  } {
    const {
      status,
      due_at,
      user_id,
      customer_id,
      bill_to,
      ship_to,
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
           status,
           due_at,
           user_id,
           customer_id,
           bill_to,
           ship_to,
           sub_total,
           discount,
           total,
           vatable_sales,
           vat_amount,
           tax,
           notes
          )
        VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );

      const stmtInvRese = db.prepare(
        `
            INSERT INTO
              inventory_reservation
              (created_at, quantity, sales_order_id, product_id)
            VALUES(?, ?, ?, ?)
            `,
      );

      const transaction = db.transaction(() => {
        const { subTotal, total } = this.calculateTotal(items, discount);
        // const subTotal = items?.reduce(
        //   (acc, cur) => (acc += (cur.quantity || 0) * cur.unit_price),
        //   0,
        // );
        // const total = subTotal - discount;

        const salesOrder = stmtSalesOrder.run(
          createdAt,
          status,
          due_at,
          user_id,
          customer_id,
          bill_to,
          ship_to,
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

          if (status === "confirmed") {
            stmtInvRese.run(
              createdAt,
              item.quantity,
              salesOrder.lastInsertRowid,
              item.product_id,
            );
          }
        }
        return salesOrder.lastInsertRowid;
      });

      const res = transaction();

      if (!res) {
        throw new Error("Something went wrong while saving the sales order");
      }

      return {
        success: true,
        data: {
          id: Number(res),
        },
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

  private checkDoubleBooking({
    items,
    salesOrderId,
  }: {
    items: UpdateSalesOrderItemsParams[];
    salesOrderId: number;
  }) {
    try {
      const db = this._database.getDb();

      let errors: string[] = [];

      const transaction = db.transaction(() => {
        for (const item of items) {
          const itemReserved = db
            .prepare(
              `
            SELECT
              *
            FROM
              inventory_reservation
            WHERE
              sales_order_id = ?
              AND
              product_id = ?
            `,
            )
            .get(salesOrderId, item.product_id) as { quantity: number };
          const quantity = itemReserved?.quantity ?? 0;

          const { product_name, available } = db
            .prepare(
              `
            SELECT
              p.name AS product_name,
              i.quantity,
              ir.quantity AS reserve,
              i.quantity - COALESCE(ir.quantity, 0) AS available
            FROM
              inventory AS i
            LEFT JOIN
              (
                SELECT
                  product_id,
                  SUM(quantity) as quantity
                FROM
                  inventory_reservation
                WHERE
                  status = 'active'
                GROUP BY
                  product_id
              ) AS ir
              ON ir.product_id = i.product_id
            LEFT JOIN
              products AS p
              ON p.id = i.product_id
            WHERE
              i.product_id = ?
        `,
            )
            .get(item.product_id) as {
            product_name: string;
            available: number;
          };

          // check if the item made the reservation
          // if yes then add it to the available

          if (item?.quantity > available + quantity) {
            errors.push(
              `${product_name} only ${available} ${available > 1 ? "are" : "is"} available `,
            );
          }
        }
      });
      transaction();
      if (errors.length) {
        return {
          success: false,
          error: `Insufficient stock(s) for
            ${errors.join("\n, ")}`,
        };
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      return {
        success: false,
        error: new Error(
          "Something went wrong while checking for product availability",
        ),
      };
    }
  }

  private calculateTotal(
    items: UpdateSalesOrderItemsParams[],
    discount: number,
    taxRate = 12,
  ) {
    const subTotal = items?.reduce(
      (acc, cur) => (acc += (cur.quantity || 0) * cur.unit_price),
      0,
    );

    const vatableSales = subTotal / (1 + taxRate);
    const vatAmount = subTotal - vatableSales;
    const total = subTotal - discount;

    return { vatableSales, vatAmount, subTotal, total };
  }
}
