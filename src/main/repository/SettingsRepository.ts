import { AppDatabase } from "../database/db";
import {
  SettingsParamType,
  SettingsType,
} from "../interfaces/ISettingRepository";
import {
  ISettingRepository,
  ReturnBackuplog,
} from "../interfaces/ISettingRepository";
import { ipcMain } from "electron";

export class SettingsRepository implements ISettingRepository {
  private _database: AppDatabase;

  constructor(database: AppDatabase) {
    this._database = database;

    ipcMain.handle("settings:get", () => this.get());
    ipcMain.handle("settings:getBackupLogs", () => this.getBackuplog());
    ipcMain.handle("settings:update", (_, params: SettingsParamType) =>
      this.update(params),
    );
    ipcMain.handle("settings:create", (_, params: SettingsType) =>
      this.create(params),
    );
    // ipcMain.handle("settings:updateLocale", (_, locale: string) =>
    //   this.updateLocale(locale),
    // );
    // ipcMain.handle("settings:uploadLogo", (_, logo: string) =>
    //   this.uploadLogo(logo),
    // );
  }

  get(): {
    data: SettingsType[] | null;
    error: Error | string;
  } {
    try {
      const db = this._database.getDb();
      const settings = db
        .prepare(`SELECT * FROM settings`)
        .all() as SettingsType[];
      return {
        data: settings,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error,
        };
      }
      return {
        data: null,
        error: new Error("Something went wrong while  retrieving the settings"),
      };
    }
  }

  getBackuplog(): ReturnBackuplog {
    try {
      const db = this._database.getDb();

      const logs = db
        .prepare(
          `
      SELECT
        *
      FROM
        backup_logs
      ORDER BY
        id
      DESC
      LIMIT 1
      `,
        )
        .get() as ReturnBackuplog["data"];

      if (!logs) {
        throw new Error();
      }

      return {
        data: logs,
        error: "",
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          data: null,
          error,
        };
      }
      return {
        data: null,
        error: new Error(
          "Something went wrong while  retrieving the backup logs",
        ),
      };
    }
  }

  // updateLocale(locale: string): {
  //   success: boolean;
  //   error: Error | string;
  // } {
  //   try {
  //     const db = this._database.getDb();
  //     db.prepare(
  //       `
  //           UPDATE
  //           FROM settings
  //           SET locale = ?
  //           `,
  //     ).run(locale);
  //     return {
  //       success: true,
  //       error: "",
  //     };
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       return {
  //         success: false,
  //         error: new Error("Something went wrong while saving the locale"),
  //       };
  //     }
  //     return {
  //       success: false,
  //       error: new Error("Something went wrong while saving the locale"),
  //     };
  //   }
  // }
  //
  create(params: SettingsType): {
    success: boolean;
    error: Error | string;
  } {
    try {
      const { key, value } = params;
      const db = this._database.getDb();

      const stmt = `
        INSERT INTO
          settings
        (key, value)
        VALUES
        (?, ?)
      `;

      db.prepare(stmt).run(key, value);

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

  update(params: SettingsParamType): {
    success: boolean;
    error: Error | string;
  } {
    try {
      const db = this._database.getDb();

      const newStmt = db.prepare(`
        INSERT INTO
          settings
          (key, value)
        VALUES(?, ?)
        ON CONFLICT (key)
        DO UPDATE SET
          key = excluded.key,
          value = ?
      `);

      const transaction = db.transaction(() => {
        Object.keys(params).forEach((key) => {
          newStmt.run(key, params[key], params[key]);
        });
      });

      transaction();

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

  // uploadLogo(path: string): {
  //   data: string;
  //   error: Error | string;
  // } {
  //   try {
  //     console.log("here upload");
  //
  //     const db = this._database.getDb();
  //     db.prepare(
  //       `
  //           UPDATE settings
  //           SET logo = ?
  //           `,
  //     ).run(path);
  //
  //     const res = this.get();
  //     if (res.data) {
  //       return {
  //         data: res.data.logo,
  //         error: "",
  //       };
  //     }
  //     throw new Error("");
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       return {
  //         data: "",
  //         error: new Error("Something went wrong while saving the logo"),
  //       };
  //     }
  //     return {
  //       data: "",
  //       error: new Error("Something went wrong while saving the logo"),
  //     };
  //   }
  // }
}
