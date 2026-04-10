import { app } from "electron";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

import { imageSize } from "image-size";

import {
  CompanyProfileType,
  ReturnSaleType,
} from "../renderer/src/shared/utils/types";
import { join } from "path";
import fs from "fs";

export default function createPDF(
  params: ReturnSaleType &
    CompanyProfileType & { logo: string; locale: string; currency: string },
): ArrayBuffer {
  const {
    logo,
    locale = "en-PH",
    currency = "PHP",
    created_at,
    invoice_number,
    status,
    customer_name,
    items,
    sub_total,
    discount,
    // vatable_sales,
    // vat_amount,
    total,
    amount,
    method,
    company_name,
    bill_to,
    ship_to,
    notes,
    address1,
    state_province,
    city,
    zip,
    phone,
  } = params;

  const Price = ({ value }: { value: number }) =>
    new Intl.NumberFormat(locale, { currency }).format((value || 0) / 100);
  const doc = new jsPDF();
  const userDataPath = app.getPath("userData");
  const imgUrl = join(userDataPath, "assets/images/logo.webp");

  doc.allowFsRead = [
    "./fonts/*",
    "assets/images/logo.webp",
    "./assets/images/logo.webp",
    imgUrl,
    join(userDataPath, "/baligya-app/assets/images/logo.webp"),
  ];

  const pageSize = doc.internal.pageSize;
  const address = `${address1 || ""}`;
  const addressH = doc.getTextDimensions(address);

  if (logo) {
    const imageData = fs.readFileSync(logo);

    const dimensions = imageSize(imageData);
    const imgWidth = dimensions.width;
    const imgHeight = dimensions.height;

    const maxWidth = 50;
    const maxHeight = 25;

    let aspectRatio = 1;
    let imgW = imgWidth;
    let imgH = imgHeight;

    if (imgWidth > maxWidth) {
      aspectRatio = maxWidth / imgWidth;
      imgW = maxWidth;
      imgH = imgHeight * aspectRatio;
    }

    if (imgHeight > maxHeight) {
      aspectRatio = maxHeight / imgHeight;
      imgW = imgWidth * aspectRatio;
      imgH = maxHeight;
    }

    const base64Image = Buffer.from(imageData).toString("base64");

    const mimeType = "image/webp";
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    doc.addImage(dataUri, "WEBP", 15, 15, imgW, imgH);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "bold");
    doc.text(String(company_name || ""), imgW + 15, 20);
    doc.setFont("Helvetica", "normal");
    doc.text(String(address1 || ""), imgW + 15, 25);
    doc.text(
      String(
        `${state_province ?? ""} ${city ?? ""} ${Number(zip) || ""}` || "",
      ),
      imgW + 15,
      addressH.h + 30,
    );
    doc.text(String(phone || ""), imgW + 15, addressH.h + 35);
  } else {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.text(String(company_name || ""), 15, 20);
    doc.setFont("Helvetica", "normal");
    doc.text(String(address1 || ""), 15, 25);
    doc.text(
      String(
        `${state_province ?? ""} ${city ?? ""} ${Number(zip) || ""}` || "",
      ),
      15,
      addressH.h + 30,
    );

    doc.text(String(phone || ""), 15, addressH.h + 35);
  }
  doc.setFont("Helvetica", "bold");
  doc.text("Sale Record", pageSize.width - 15, 15, { align: "right" });
  doc.setFontSize(10);
  doc.text(String(invoice_number), pageSize.width - 15, 20, { align: "right" });
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    String(new Date(created_at).toLocaleString()),
    pageSize.width - 15,
    25,
    {
      align: "right",
    },
  );
  {
    status &&
      doc.text(
        `${status?.[0]?.toUpperCase()}${status?.slice(1)}`,
        pageSize.width - 15,
        30,
        {
          align: "right",
        },
      );
  }

  doc.setFont("Helvetica", "bold");
  doc.text("Customer's Name", 15, 50);
  doc.setFont("Helvetica", "normal");
  doc.text(customer_name ?? "", 15, 55);

  autoTable(doc, {
    head: [["Bill To", "Ship To"]],
    body: [[bill_to ?? "", ship_to ?? ""]],
    theme: "plain",
    startY: 60,
    headStyles: {
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
  });

  const firstY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  const tHeaders = ["Name", "Quantity", "Unit Price", "Total"];

  const tData = items.map((item) => [
    item.name,
    String(item.quantity),
    String(item.unit_price / 100),
    String(item.line_total / 100),
  ]);

  autoTable(doc, {
    styles: {
      halign: "right",
      lineWidth: 0,
    },
    didParseCell: function (data) {
      if (data.section === "head" && data.column.dataKey === 0) {
        data.cell.styles.halign = "left";
      }
    },
    columnStyles: {
      0: {
        halign: "left",
      },
    },
    head: [tHeaders],
    body: tData,
    foot: [
      [
        "",
        "",
        "Sub Total:",
        Price({
          value: sub_total,
        }),
      ],
      [
        {
          content: `Notes: ${notes || ""}`,
          colSpan: 2,
          rowSpan: 5,
          styles: {
            lineWidth: 0.5,
            lineColor: [0, 0, 0],
            halign: "left",
            fontStyle: "normal",
          },
        },
        "Discount:",
        `(${Price({ value: discount })})`,
      ],
      // ["", "", "Vatable Sales:", Price({ value: vatable_sales })],
      // ["", "", "Less VAT:", Price({ value: vat_amount })],
      ["Total:", Price({ value: total })],
      ["Paid Amount:", Price({ value: amount })],
      ["Change Due:", Price({ value: total - amount })],
    ],
    headStyles: {
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
    },
    footStyles: {
      fillColor: false,
      textColor: [0, 0, 0],
      halign: "right",
      lineColor: false,
      fontSize: 8,
    },
    startY: firstY,
    showHead: "firstPage",
  });

  const finalY =
    (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
      .finalY + 10;

  {
    method &&
      doc.text(
        `Payment Method: ${method?.[0]?.toUpperCase()}${method?.slice(1)}`,
        pageSize.width - 15,
        finalY,
        {
          align: "right",
        },
      );
  }

  const signatureText = "Signature:";
  const textX = 15;
  const textY = finalY;

  doc.text(signatureText, textX, textY);

  const textWidth =
    (doc.getStringUnitWidth(signatureText) * doc.getFontSize()) /
    doc.internal.scaleFactor;

  const lineStartX = textX + textWidth + 2;
  const lineEndX = lineStartX + 30;
  const lineY = textY + doc.getFontSize() * 0.35;
  doc.setLineWidth(0.5);
  doc.setDrawColor(0, 0, 0); // Black color

  doc.line(lineStartX, lineY, lineEndX, lineY);

  const blob = doc.output("arraybuffer");

  return blob;
}
