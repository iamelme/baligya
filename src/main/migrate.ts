import fs from "fs";
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { AppDatabase } from "./database/db";

export default function runMigration(db: AppDatabase) {
  const dir = join(process.cwd(), "./src/main/migrations");
  // console.log("env", process.env.NODE_ENV);
  // console.log("cwd", process.cwd());
  //
  // console.log({ dir });

  db.getDb().exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY
    )
  `);

  const getVersion = db
    .getDb()
    .prepare("SELECT MAX(version) as v FROM schema_migrations")
    .get() as { v: number };

  const currentVersion = getVersion.v || 0;

  fs.access(dir, fs.constants.F_OK, async (err) => {
    if (err) {
      console.error(`${dir} does not exist or is not accessible`);
    } else {
      try {
        const files = await readdir(dir);

        for (const file of files) {
          const version = Number(file.split("_")[0]);
          console.log({ file }, "file", version);

          if (version > currentVersion) {
            const sql = await readFile(join(dir, file), "utf8");

            db.getDb().exec("BEGIN");
            db.getDb().exec(sql);

            db.getDb()
              .prepare("INSERT INTO schema_migrations(version) VALUES (?)")
              .run(version);

            db.getDb().exec("COMMIT");
          }
        }
      } catch (err) {
        console.error("Error reading directory:", err);
      }
    }
  });
}
