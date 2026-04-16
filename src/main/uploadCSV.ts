import csv from "csv-parser";
import fs from "fs";
import { AppDatabase } from "./database/db";
import { dialog } from "electron";
import { errorMapper } from "./utils";

export default async function uploadCSV({ stmt }: { stmt: string }) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: "CSV", extensions: ["csv"] }],
    properties: ["openFile"],
  });

  if (!filePaths?.length || canceled) {
    return { success: true };
  }

  const db = new AppDatabase();
  const results: unknown[] = [];

  return new Promise((res) => {
    fs.createReadStream(filePaths[0])
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        try {
          const insertStmt = db.getDb().prepare(stmt);
          const insertMany = db.getDb().transaction((data) => {
            for (const d of data) {
              insertStmt.run(d);
            }
          });

          insertMany(results);
          res({ success: true });
        } catch (error) {
          console.log("trans error", error);
          res({ success: false, error: errorMapper(error) });
        }
      })
      .on("error", (err) => {
        if (err) {
          console.log("error ===> ", err);
          res({ success: false, error: errorMapper(err) });
          return;
        }
      });
  });
}
