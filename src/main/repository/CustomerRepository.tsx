import { ipcMain } from "electron";
import { CustomerType, ErrorType } from "@renderer/shared/utils/types";
import {
  ICustomerRepository,
  ReturnAllCustomerType,
  ReturnCustomerType,
} from "../interfaces/ICustomerRepository";
import { AppDatabase } from "../database/db";

export default class CustomerRepository implements ICustomerRepository {
  private _database: AppDatabase;
  constructor(database: AppDatabase) {
    this._database = database;
    ipcMain.handle("customer:create", (_, params: CustomerType) =>
      this.create(params),
    );
    ipcMain.handle("customer:getById", (_, id: number) => this.getById(id));
    ipcMain.handle("customer:getAll", () => this.getAll());
    ipcMain.handle("customer:update", (_, params: CustomerType) =>
      this.update(params),
    );
    ipcMain.handle("customer:delete", (_, id: number) => this.delete(id));
  }
  update(params: Omit<CustomerType, "created_at">): {
    success: boolean;
    error: ErrorType;
  } {
    const { id, name, address, phone } = params;
    try {
      const db = this._database.getDb();

      const stmt = db.prepare(
        `
        UPDATE
          customers
        SET
          name = ?,
          address = ?,
          phone = ?
        WHERE
          id = ?
        `,
      );

      const customer = stmt.run(name, address, phone, id);

      if (!customer) {
        throw new Error("Something went wrong while updating a customer");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error,
        };
      }

      return {
        success: false,
        error: "Something wen't wrong while updating a customer.",
      };
    }
  }

  delete(id: number): { success: boolean; error: ErrorType } {
    try {
      const db = this._database.getDb();

      const customer = db
        .prepare(
          `
        DELETE FROM
          customers
        WHERE
          id = ?
        `,
        )
        .run(id);

      if (!customer) {
        throw new Error("Something went wrong while deleting a customer");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error,
        };
      }

      return {
        success: false,
        error: "Something wen't wrong while deleting a customer.",
      };
    }
  }

  getAll(): ReturnAllCustomerType {
    try {
      const db = this._database.getDb();

      const stmt = db.prepare(
        `
        SELECT
          *
        FROM
          customers
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
            name = :name`);

      const transaction = db.transaction(() => {
        const customers = stmt.all({ limit: 50, offset: 0 }) as CustomerType[];

        if (!customers) {
          throw new Error(
            "Something went wrong while retrieving the customers",
          );
        }

        const total = stmtCount.get({ name: "products" }) as { count: number };

        return {
          total: total?.count || 0,
          results: customers,
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
          error: error,
        };
      }

      return {
        data: {
          total: 0,
          results: null,
        },
        error: "Something went wrong while retrieving the customers",
      };
    }
  }

  getById(id: number): ReturnCustomerType {
    try {
      const db = this._database.getDb();
      const customer = db
        .prepare(
          `
        SELECT
          *
        FROM
          customers
        WHERE
          id = ?
        `,
        )
        .get(id) as CustomerType;

      if (!customer) {
        throw new Error("Something went wrong while retrieving a customer");
      }

      return {
        data: customer,
        error: "",
      };
    } catch (error) {
      return {
        data: null,
        error: "Something went wrong while retrieving a customer",
      };
    }
  }

  create(params: Omit<CustomerType, "id" | "created_at">): {
    success: boolean;
    error: ErrorType;
  } {
    const { name, address, phone } = params;
    try {
      const db = this._database.getDb();

      const createdAt = new Date().toISOString();

      const stmt = db.prepare(
        `
        INSERT INTO
          customers
          (created_at, name, address, phone)
        VALUES(?, ?, ?, ?)
        `,
      );

      const customer = stmt.run(createdAt, name, address, phone);

      if (!customer) {
        throw new Error("Something went wrong while creating a customer");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error,
        };
      }

      return {
        success: false,
        error: "Something wen't wrong while creating a customer.",
      };
    }
  }
}
