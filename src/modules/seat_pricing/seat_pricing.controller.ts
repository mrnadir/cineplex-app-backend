import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SeatPricingService } from "./seat_pricing.service";

export class SeatPricingController {
  private seatPricingService = new SeatPricingService();

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.seatPricingService.createToDB({
      admin_id: req.user?.user_id,
      ...req.body,
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Seat Pricing created successfully",
      data: result,
    });
  });

  adminRetrieve = catchAsync(async (req: Request, res: Response) => {
    const result =
      await this.seatPricingService.retrieveAdminSeatPricingsFromDB(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Seat Pricings retrieved successfully",
      data: result.seatPricings,
      meta: result.pagination,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const result = await this.seatPricingService.updateInDB(
      req.params.id as string,
      req.body
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Seat Pricing updated successfully",
      data: result,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.seatPricingService.deleteFromDB(Number(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Seat Pricing deleted successfully",
    });
  });
}
