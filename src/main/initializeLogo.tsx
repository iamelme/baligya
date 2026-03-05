import fs from "fs";
import { app } from "electron";
import { join } from "path";

export default function initializeLogo() {
  const userDataPath = app.getPath("userData");
  const imagePath = join(userDataPath, "./assets/images");

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      fs.mkdirSync(imagePath, { recursive: true });
      const source = join(__dirname, "../../resources/icon.png");
      const dest = join(imagePath, "logo.webp");
      fs.copyFile(source, dest, (err) => {
        if (err) throw err;
      });
    }
  });
}
