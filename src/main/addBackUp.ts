import Database from "better-sqlite3";
import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { join } from "path";
import { AppDatabase } from "./database/db";

export function addBackUp(db: AppDatabase) {
  ipcMain.handle("save-db", async (_) => {
    const date = new Date();
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      const { canceled, filePath } = await dialog.showSaveDialog(win, {
        title: "Select a location to save your database backup",
        defaultPath: join(
          app.getPath("downloads"),
          `baligya_${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        ),
        buttonLabel: "Save",
      });

      if (canceled) {
        return;
      }

      try {
        db.getDb().pragma("journal_mode = WAL");
        db.getDb().exec(`VACUUM INTO '${filePath}.db';`);

        const newDb = new Database(`${filePath}.db`);

        const result = newDb.pragma("integrity_check", {
          simple: true,
        });

        console.log("result", result);

        db.getDb()
          .prepare(
            "INSERT INTO backup_logs (created_at, filename, status) VALUES (?, ?, ?)",
          )
          .run(new Date().toISOString(), `${filePath}.db`, result);
      } catch (error) {
        console.log(error);
        if (error instanceof Error) {
          dialog.showErrorBox("Save Failed", error.message);
        }
      }
    }
  });
}
