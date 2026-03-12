import { app, shell, BrowserWindow, ipcMain, protocol, net } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import { AppDatabase } from "./database/db";
import { CategoryRepository } from "./repository/CategoryRepository";
import { ProductRepository } from "./repository/ProductRepository";
import { InventoryRepository } from "./repository/InventoryRepository";
import { UserRepository } from "./repository/UserRepository";
import { CartRepository } from "./repository/CartRepository";
import { SaleRepository } from "./repository/SaleRepository";
import { ReturnRepository } from "./repository/ReturnRepository";
import { SettingsRepository } from "./repository/SettingsRepository";
import createPDF from "./createInvoicePDF";
import {
  CompanyProfileType,
  ReturnSaleType,
} from "../renderer/src/shared/utils/types";
import { hashPassword } from "./hashPassword";
import verifyPassword from "./verifyPassword";
import initializeLogo from "./initializeLogo";
import { addBackUp } from "./addBackUp";
import uploadLogo from "./uploadLogo";
import runMigration from "./migrate";
import uploadBackup from "./uploadBackup";

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

const protocolName = "elme-cute";
protocol.registerSchemesAsPrivileged([
  { scheme: protocolName, privileges: { bypassCSP: true } },
]);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows

  // protocol.handle(protocolName, (request: Request) => {
  protocol.handle(protocolName, (request: Request) => {
    // const userDataPath = app.getPath('userData')
    // return net.fetch(`${protocolName}://${userDataPath}`)

    const url = request.url.replace(`${protocolName}://`, "file://");
    return net.fetch(url);

    // const filePath = request.url.slice(`${protocolName}://`.length)
    // Serve a file from your application directory
    // return net.fetch(url.pathToFileURL(path.resolve(__dirname, filePath)).toString())
  });

  electronApp.setAppUserModelId("com.electron");

  const appDb = new AppDatabase();

  const inventory = new InventoryRepository(appDb);

  new CategoryRepository(appDb);
  new ProductRepository(appDb);
  new UserRepository(appDb, hashPassword, verifyPassword);
  new CartRepository(appDb);
  const sales = new SaleRepository(appDb, inventory);
  new SettingsRepository(appDb);
  new ReturnRepository(appDb, inventory, sales);

  initializeLogo(appDb);
  runMigration(appDb);

  addBackUp(appDb);
  uploadBackup(appDb);

  ipcMain.handle("get-locale", () => {
    return app.getLocale();
  });

  ipcMain.handle(
    "create-pdf",
    (
      _,
      params: ReturnSaleType &
        CompanyProfileType & {
          logo: string;
          locale: string;
          currency: string;
        },
    ) => {
      return createPDF(params);
    },
  );

  ipcMain.handle("print-pdf", async (_, arrayBuffer) => {
    const printWin = new BrowserWindow({ show: false });

    // Convert ArrayBuffer → base64 data URL
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;

    await printWin.loadURL(dataUrl);

    printWin.webContents.on("did-finish-load", () => {
      // 4. Print
      printWin.webContents.print(
        {
          silent: true,
          printBackground: true,
        },
        (success, failureReason) => {
          if (!success) console.error(failureReason);
          printWin.close(); // Close the hidden printWindow
        },
      );
    });

    // // Wait for it to finish rendering
    // await new Promise((resolve) =>
    //   printWin.webContents.once("zoom-changed", resolve),
    // );
    //
    // printWin.webContents.print(
    //   { silent: true, printBackground: true },
    //   (success, errorType) => {
    //     console.log({ success });
    //     if (!success) console.error("Print failed:", errorType);
    //     printWin.close();
    //   },
    // );
  });

  ipcMain.handle("hash-password", async (_, password: string) => {
    return hashPassword(password);
  });

  ipcMain.handle(
    "verify-password",
    async (_, params: { hashedPassword: string; password: string }) => {
      console.log("handle main verify-password", params);
      return verifyPassword(params.hashedPassword, params.password);
    },
  );

  uploadLogo();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  ipcMain.on("ping", () => console.log("pong"));

  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
