import fs from "fs";
import { app } from "electron";
import { join } from "path";
import { Database } from "better-sqlite3";

export default function initializeLogo(db: Database) {
  const userDataPath = app.getPath("userData");
  const imagePath = join(userDataPath, "./assets/images");

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      fs.mkdir(imagePath, { recursive: true }, (err) => {
        if (err) throw err;

        const source = join(__dirname, "../../resources/icon.png");
        const dest = join(imagePath, "logo.webp");
        fs.copyFile(source, dest, (err) => {
          if (err) throw err;

          db.prepare(`UPDATE settings SET logo = ?`).run(dest);
        });
      });
    }
  });
}
