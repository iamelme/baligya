import { AppDatabase } from "../database/db";
import { SettingsType } from "../../renderer/src/features/settings/utils/type";
import { ISettingRepository } from "../interfaces/ISettingRepository";
import { ipcMain } from "electron";

export class SettingsRepository implements ISettingRepository {
  private _database: AppDatabase;

  constructor(database: AppDatabase) {
    this._database = database;

    ipcMain.handle("settings:get", () => this.get());
    ipcMain.handle("settings:update", (_, params: Partial<SettingsType>) =>
      this.update(params),
    );
    ipcMain.handle("settings:updateLocale", (_, locale: string) =>
      this.updateLocale(locale),
    );
    ipcMain.handle("settings:uploadLogo", (_, logo: string) =>
      this.uploadLogo(logo),
    );
  }

  get(): {
    data: SettingsType | null;
    error: Error | string;
  } {
    try {
      const db = this._database.getDb();
      const settings = db
        .prepare(`SELECT * FROM settings`)
        .get() as SettingsType;
      return {
        data: settings,
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

  updateLocale(locale: string): {
    success: boolean;
    error: Error | string;
  } {
    try {
      const db = this._database.getDb();
      db.prepare(
        `
            UPDATE
            FROM settings
            SET locale = ?
            `,
      ).run(locale);
      return {
        success: true,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          success: false,
          error: new Error("Something went wrong while saving the locale"),
        };
      }
      return {
        success: false,
        error: new Error("Something went wrong while saving the locale"),
      };
    }
  }

  update(params: Partial<SettingsType>): {
    success: boolean;
    error: Error | string;
  } {
    try {
      const db = this._database.getDb();

      const columns: string[] = [];
      const values: string[] = [];

      console.log({ params });

      Object.keys(params).forEach((key) => {
        columns.push(`${key} = ?`);
        values.push(params[key]);
      });

      const stmt = `
      UPDATE
        settings
        SET
      `;

      const query = `${stmt} ${columns.join(",")}`;

      console.log({ query });

      db.prepare(query).run(...values);

      console.log(...values);

      return {
        success: true,
        error: "",
      };
    } catch (error) {
      console.log(error);
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: "Something wen't wrong",
      };
    }
  }

  uploadLogo(path: string): {
    data: string;
    error: Error | string;
  } {
    try {
      console.log("here upload");

      const db = this._database.getDb();
      db.prepare(
        `
            UPDATE settings
            SET logo = ?
            `,
      ).run(path);

      const res = this.get();
      if (res.data) {
        return {
          data: res.data.logo,
          error: "",
        };
      }
      throw new Error("");
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: "",
          error: new Error("Something went wrong while saving the logo"),
        };
      }
      return {
        data: "",
        error: new Error("Something went wrong while saving the logo"),
      };
    }
  }
}
