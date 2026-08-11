import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SeatTypeService } from "./seat_type.service";

export class SeatTypeController {
  private seatTypeService = new SeatTypeService();

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.seatTypeService.createToDB({
      admin_id: req.user?.user_id,
      ...req.body,
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Seat Type created successfully",
      data: result,
    });
  });

  adminRetrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.seatTypeService.retrieveAdminSeatTypesFromDB(
      req.query
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Seat Types retrieved successfully",
      data: result.seatTypes,
      meta: result.pagination,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.seatTypeService.deleteFromDB(Number(req.params.id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Show deleted successfully",
    });
  });
}
