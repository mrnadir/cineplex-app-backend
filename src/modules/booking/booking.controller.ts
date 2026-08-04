import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import generateTicketPDF from "../../utils/generatePDF";
import {
  buildTicketEmailJob,
  emailQueue,
} from "../../shared/email/email.queue";

export class TheaterController {
  create = catchAsync(async (req: Request, res: Response) => {
    const pdfBuffer = await generateTicketPDF();

    const emailRecipient = "nadirhossain336@gmail.com";

    if (emailRecipient) {
      await emailQueue.add(
        "ticket-email",
        buildTicketEmailJob({
          to: emailRecipient,
          pdfBuffer,
          fileName: `ticket-${Date.now()}.pdf`,
          context: {
            bookingId: req.body?.bookingId || "BK-2026-000123",
          },
        })
      );
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Ticket PDF generated and queued for delivery",
    });
  });
}
