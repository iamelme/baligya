import {
  ICategoryRepository,
  ReturnCatAllType,
  ReturnType,
} from "../interfaces/ICategoryRepository";
import {
  CategoryType,
  CustomResponseType,
} from "../../renderer/src/shared/utils/types";
import { ipcMain } from "electron";
import { AppDatabase } from "../database/db";

export class CategoryRepository implements ICategoryRepository {
  private _database: AppDatabase;

  constructor(database: AppDatabase) {
    this._database = database;
    ipcMain.handle("category:getAll", () => this.getAll());
    ipcMain.handle("category:getById", (_, id: number) => this.getById(id));
    ipcMain.handle("category:getByName", (_, name: string) =>
      this.getByName(name),
    );
    ipcMain.handle("category:create", (_, name: string) => this.create(name));
    ipcMain.handle(
      "category:update",
      (_, { id, name }: { id: number; name: string }) =>
        this.update({ id, name }),
    );
    ipcMain.handle("category:delete", (_, id: number) => this.delete(id));
  }

  getAll(): ReturnCatAllType {
    try {
      const db = this._database.getDb();

      const categories = db
        .prepare(
          `
          SELECT
            *
          FROM
            categories
          ORDER BY
            name ASC
                 `,
        )
        .all() as CategoryType[];

      console.log({ categories });

      if (categories) {
        return {
          data: {
            total: 0,
            results: categories,
          },
          error: "",
        };
      }

      return {
        data: {
          total: 0,
          results: null,
        },
        error: new Error(
          "Something went wrong while retrieving the categories",
        ),
      };
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        return {
          data: {
            total: 0,
            results: null,
          },
          error: new Error(
            "Something went wrong while deleting the categories",
          ),
        };
      }
      return {
        data: {
          total: 0,
          results: null,
        },
        error: new Error("Something went wrong while deleting the categories"),
      };
    }
  }

  getById(id: number): ReturnType {
    try {
      const db = this._database.getDb();

      const category = db
        .prepare("SELECT * FROM categories WHERE id= ?")
        .get(id) as CategoryType;

      if (category) {
        return {
          data: category,
          error: "",
        };
      }

      return {
        data: null,
        error: new Error("Something went wrong while retrieving the products"),
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while deleting the product"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while deleting the product"),
      };
    }
  }

  getByName(name: string): ReturnType {
    try {
      const db = this._database.getDb();

      const category = db
        .prepare("SELECT * FROM categories WHERE LOWER(name) = ?")
        .get(name) as CategoryType;

      console.log("repo category", category);

      if (category) {
        return {
          data: category,
          error: "",
        };
      }

      return {
        data: null,
        error: new Error("Something went wrong while saving a category"),
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error: new Error("Something went wrong while saving a category"),
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while saving a category"),
      };
    }
  }

  create(name: string): CustomResponseType {
    const normalizeName = name?.trim();

    // const found = this._database
    //   .prepare('SELECT id, name FROM categories WHERE name LIKE ?')
    //   .get(`${normalizeName}%`)

    // console.log('found', found)
    // if (found && found.name.toLowerCase() === normalizeName.toLowerCase()) {
    //   return {
    //     success: false,
    //     error: 'Category already existed'
    //   }
    // }
    try {
      const db = this._database.getDb();
      const category = db

        .prepare("INSERT INTO categories (name) VALUES ( ?) RETURNING *")
        .get(normalizeName);

      console.log("create category", category);

      if (!category) {
        throw new Error("Something went wrong while saving a category");
      }
      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        console.log("error name", error.name);
        if (error instanceof Error) {
          return {
            success: true,
            error: new Error("Something went wrong while saving a category."),
          };
        }
      }
      return {
        success: true,
        error: new Error("Something went wrong while saving a category"),
      };
    }
  }

  update({ id, name }: { id: number; name: string }): CustomResponseType {
    console.log({ id, name });

    const normalizeName = name?.trim();

    try {
      const db = this._database.getDb();
      const stmt = db.prepare(
        "UPDATE categories SET name = ? WHERE id = ? RETURNING *",
      );
      const updatedRow = stmt.run(normalizeName, id);
      console.log("updatedRow", updatedRow);
      console.log(`Rows changed: ${updatedRow.changes}`);

      if (!updatedRow?.changes) {
        throw new Error("Something went wrong while updating a category");
      }

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
        console.log("error name", error.name);
        return {
          success: false,
          error: new Error("Something went wrong while updating the category."),
        };
      }
      return {
        success: false,
        error: new Error("Something went wrong while updating the category."),
      };
    }
  }

  delete(id: number): { success: boolean; error: Error | string } {
    try {
      const db = this._database.getDb();
      const stmt = db.prepare("DELETE FROM categories WHERE id = ?");

      stmt.run(id);

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return {
          success: false,
          error: new Error("Something went wrong while deleting the product"),
        };
      }
      return {
        success: false,
        error: new Error("Something went wrong while deleting the product"),
      };
    }
  }
}
