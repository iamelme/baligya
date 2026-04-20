import { ipcMain } from "electron";
import {
  IReturnRepository,
  Return,
  ReturnAllParams,
  ReturnAllType,
  ReturnByIdType,
} from "../interfaces/IReturnRepository";
import {
  ProductType,
  ReturnItemType,
  ReturnType,
  SaleType,
} from "../../renderer/src/shared/utils/types";
import { IInventoryRepository } from "../interfaces/IInventoryRepository";
import { ISaleRepository } from "../interfaces/ISaleRepository";
import { AppDatabase } from "../database/db";
import { errorMapper } from "../utils";
import Database from "better-sqlite3";

export class ReturnRepository implements IReturnRepository {
  private _database: AppDatabase;
  private _inventory: IInventoryRepository;
  private _sales: ISaleRepository;

  constructor(
    database: AppDatabase,
    inventory: IInventoryRepository,
    sales: ISaleRepository,
  ) {
    this._database = database;
    this._inventory = inventory;
    this._sales = sales;
    ipcMain.handle("return:getAll", (_, params: ReturnAllParams) =>
      this.getAll(params),
    );
    ipcMain.handle("return:getById", (_, id: number) => this.getById(id));
    ipcMain.handle("return:create", (_, params: ReturnType) =>
      this.create(params),
    );
  }

  getById(id: number): ReturnByIdType {
    try {
      const db = this._database.getDb();

      const stmt = db.prepare(
        `
        SELECT
          r.*,
          s.invoice_number
        FROM
          returns AS r
        LEFT JOIN
          sales AS s
        ON
          s.id = r.sale_id
        WHERE
          r.id = ?
        `,
      );

      const stmtItems = db.prepare(
        `
        SELECT
          ri.*,
          p.name,
          p.unit
        FROM
          return_items AS ri
        LEFT JOIN
          products AS p
        ON
          p.id = ri.product_id
        WHERE
          ri.return_id = ?
        `,
      );

      const transaction = db.transaction(() => {
        const returns = stmt.get(id) as ReturnType & SaleType;

        const items = stmtItems.all(id) as Array<ReturnItemType & ProductType>;

        return {
          ...returns,
          items,
        };
      });

      const res = transaction();

      if (!res) {
        throw new Error("Something went wrong while retreiving a sales return");
      }

      return {
        data: res,
        error: "",
      };
    } catch (error) {
      return {
        data: null,
        error: errorMapper(error),
      };
    }
  }

  getAll(params: ReturnAllParams): ReturnAllType {
    const { pageSize, offset } = params;

    try {
      const db = this._database.getDb();
      const stmt = db.prepare(
        `
        SELECT
          *
        FROM
          returns
        WHERE
          (:startDate IS FALSE OR created_at >= :startDate )
          AND (:endDate IS FALSE OR created_at <= :endDate )
        LIMIT :limit
        OFFSET :offset
        `,
      );

      const stmtCount = db.prepare(`
          SELECT
            count
          FROM
            counter
          WHERE
            name = :name
                                    `);

      const transaction = db.transaction(() => {
        const returns = stmt.all({
          ...params,
          limit: pageSize,
          offset: offset ? offset * pageSize : offset,
        }) as ReturnType[];

        const total = stmtCount.get({ name: "returns" }) as { count: number };

        return {
          total: total?.count || 0,
          results: returns,
        };
      });

      const res = transaction();

      if (!res) {
        throw new Error("Something went wrong while retrieving returns");
      }

      return {
        data: {
          total: res.total,
          results: res.results,
        },
        error: "",
      };
    } catch (error) {
      return {
        data: null,
        error: errorMapper(error),
      };
    }
  }

  create(params: ReturnType): Return {
    const { sale_id, user_id, items } = params;

    console.log({ params });
    const db = this._database.getDb();

    const begin = db.prepare("BEGIN IMMEDIATE");
    const commit = db.prepare("COMMIT");
    const rollback = db.prepare("ROLLBACK");

    const createdAt = new Date().toISOString();

    const insertReturn = db.prepare(
      `
                INSERT INTO returns
                (created_at, amount, method, sale_id, user_id)
                VALUES(?, ?, ?, ?, ?)
                `,
    );

    const insertReturnItem = db.prepare(
      `
                INSERT INTO return_items
                (created_at, return_id, quantity, refund_price, disposition, product_id, sale_item_id)
                VALUES(?, ?, ?, ?, ?, ?, ?);
                `,
    );
    // amount INTEGER,
    // return_id INTEGER,
    // customer_id INTEGER,
    // user_id INTEGER,
    // sale_id INTEGER,

    const insertCM = db.prepare(
      `
      INSERT INTO credit_memos
      (created_at, return_id, amount, sale_id, user_id)
      VALUES(?, ?, ?, ?, ?)
      `,
    );

    // quantity INTEGER,
    // unit_price INTEGER,
    // credit_memo_id INTEGER,
    // product_id INTEGER,
    // sale_item_id INTEGER,

    const insertCMItem = db.prepare(
      `
      INSERT INTO credit_memo_items
      (created_at, quantity, unit_price, credit_memo_id, product_id, sale_item_id)
      VALUES(?, ?, ?, ?, ?, ?)
      `,
    );

    const stmtReturns = db.prepare(
      `
      SELECT
        *
      FROM
        returns
      WHERE
        sale_id = ?
      AND
        method != 'credit_memo'
      `,
    );

    begin.run();

    try {
      //   console.log('trans start')
      console.log("items", items);
      if (!items.length) {
        throw new Error("No items selected");
      }
      const hasChanges = items.every((item) => item.quantity > 0);
      if (!hasChanges) {
        throw new Error("No changes");
      }

      const sales = this._sales.getById(sale_id);

      console.log({ sales });

      if (!sales.data) {
        throw new Error("Couldn't check its sales data");
      }

      const returns = stmtReturns.all(sale_id) as ReturnType[];

      const returnAmount = returns?.reduce(
        (acc, cur) => (acc += cur?.amount || 0),
        0,
      );

      const { items: saleItems, amount = 0, total = 0 } = sales.data;

      // check the amount <= 0 then it is unpaid
      // then it goes to credit memo and and reduce balance due

      console.log({ saleItems });

      const areAllReturned = saleItems?.reduce((acc, cur) => {
        const foundItem = items.find((item) => item.sale_item_id === cur.id);

        if (!acc) {
          return false;
        }

        if (!foundItem && cur.available_qty !== 0) {
          return false;
        }

        if (foundItem) {
          return cur.available_qty - foundItem.quantity === 0;
        }

        return acc;
      }, true);

      console.log({ areAllReturned });

      // const areAllReturned = saleItems?.every(item => item.return_qty ===)
      const totalReturnAmount =
        items.reduce(
          (acc, item) =>
            (acc += (item?.quantity || 0) * (item?.refund_price || 0)),
          0,
        ) + returnAmount;

      let resInserCM: Database.RunResult | undefined;
      let resInserReturn: Database.RunResult | undefined;

      let method = "cash";

      const balance = totalReturnAmount - amount;

      if (amount === 0) {
        // unpaid
        resInserReturn = insertReturn.run(
          createdAt,
          balance,
          "credit_memo",
          sale_id,
          user_id,
        );
        resInserCM = insertCM.run(
          createdAt,
          resInserReturn.lastInsertRowid,
          balance,
          sale_id,
          user_id,
        );
      } else if (amount === total) {
        // complete
        resInserReturn = insertReturn.run(
          createdAt,
          totalReturnAmount - returnAmount,
          "cash",
          sale_id,
          user_id,
        );
      } else {
        // partial paid

        if (totalReturnAmount > amount) {
          const creditMemoAmount = totalReturnAmount - amount;
          const cashRefund = amount - returnAmount;

          resInserReturn = insertReturn.run(
            createdAt,
            creditMemoAmount,
            "credit_memo",
            sale_id,
            user_id,
          );

          resInserCM = insertCM.run(
            createdAt,
            resInserReturn.lastInsertRowid,
            creditMemoAmount,
            sale_id,
            user_id,
          );

          if (cashRefund) {
            insertReturn.run(createdAt, cashRefund, method, sale_id, user_id);
          }
        } else {
          resInserReturn = insertReturn.run(
            createdAt,
            totalReturnAmount,
            method,
            sale_id,
            user_id,
          );
        }
      }

      // const res = insertReturn.run(
      //   createdAt,
      //   totalReturnAmount,
      //   method,
      //   sale_id,
      //   user_id,
      // );
      //
      // console.log({ res });
      // console.log({ items });

      // if (!res.changes) {
      //   throw new Error("Something went wrong while creating a return order");
      // }

      //   console.log('start items')

      for (const item of items) {
        console.log("return item", item);
        if (item.disposition === "restock") {
          const resInv = this._inventory.update({
            quantity: item.quantity,
            id: item.inventory_id,
            product_id: item.product_id,
            user_id: item.user_id,
            movement_type: 0,
            reference_type: "return",
          });
          if (!resInv.success && resInv.error instanceof Error) {
            throw new Error(resInv.error.message);
          }
        }

        if (item.available_qty < 1) {
          throw new Error("You can't return this item");
        }

        const resItem = insertReturnItem.run(
          createdAt,
          resInserReturn.lastInsertRowid,
          item.quantity,
          item.refund_price,
          item.disposition,
          item.product_id,
          item.sale_item_id,
        );

        console.log({ resItem });

        if (!resItem.changes) {
          throw new Error("Something went wrong while creating a return item");
        }

        console.log({ resInserCM });

        if (resInserCM !== undefined && resInserCM.changes) {
          const res = insertCMItem.run(
            createdAt,
            item.quantity,
            (item.quantity || 0) * (item.refund_price || 0),
            resInserCM.lastInsertRowid,
            item.product_id,
            item.sale_item_id,
          );

          if (!res.changes) {
            throw new Error(
              "Something went wrong while creating a credit memo item",
            );
          }
        }
      }

      let status: SaleType["status"] = "partial_return";
      if (areAllReturned) {
        status = "return";
      }

      this._sales.updateStatus({ id: sale_id, status });

      commit.run();

      return {
        data: null,
        error: "",
      };
    } catch (error) {
      if (db.inTransaction) {
        rollback.run();
      }
      //   console.error('error', error)
      return {
        data: null,
        error: errorMapper(error),
      };

      // if (error instanceof Error) {
      //   return {
      //     data: null,
      //     error: new Error(
      //       "Something went wrong while creating a return order",
      //     ),
      //   };
      // }
      // return {
      //   data: null,
      //   error: new Error("Something went wrong while creating a return order"),
      // };
    }
  }
}
