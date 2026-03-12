import { BrowserWindow } from "electron";

export default async function (params: {
  arrayBuffer: ArrayBuffer;
  isSilent?: boolean;
}) {
  const { arrayBuffer, isSilent = true } = params;
  const printWin = new BrowserWindow({ show: !isSilent });

  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  await printWin.loadURL(dataUrl);

  printWin.webContents.on("did-finish-load", () => {
    printWin.webContents.print(
      {
        silent: isSilent,
        printBackground: true,
      },
      (success, failureReason) => {
        if (!success) console.error(failureReason);
        printWin.close();
      },
    );
  });
}
