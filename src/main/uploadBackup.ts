import { ipcMain, dialog, app } from "electron";
import { join } from "path";

import fsp from "fs/promises";
import Database from "better-sqlite3";

import { AppDatabase } from "./database/db";

export default function uploadBackup(db: AppDatabase) {
  ipcMain.handle("upload-backup", async (): Promise<boolean> => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: "Database", extensions: ["db"] }],
      properties: ["openFile"],
    });

    const userDataPath = app.getPath("userData");
    const dest = join(userDataPath, "baligya.db");
    const wal = join(userDataPath, "baligya.db-wal");
    const shm = join(userDataPath, "baligya.db-shm");

    // console.log("dest ", dest);

    if (!canceled && filePaths?.length) {
      try {
        await fsp.unlink(wal).catch(() => {});
        await fsp.unlink(shm).catch(() => {});

        await fsp.copyFile(filePaths[0], dest);

        const newDb = new Database(dest);
        db.updateDb(newDb);

        return true;
      } catch (error) {
        console.log(error);

        return false;
      }
    }

    return false;
  });
}
