import puppeteer from "puppeteer";
import { createTicketHTML } from "../eTicket/eTicket.service";

async function generatePDF(): Promise<Buffer> {
  const html = await createTicketHTML({
    bookingId: "BK-2026-000123",
    bookedSeats: ["E6", "E7", "E8", "E9"],
  });
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export = generatePDF;
