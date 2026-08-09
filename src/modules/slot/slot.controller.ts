import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { SlotService } from "./slot.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

export class SlotController {
  private slotService = new SlotService();

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.slotService.createSlotToDB({
      admin_id: req.user?.user_id,
      ...req.body,
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Slot created successfully",
      data: result,
    });
  });

  retrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.slotService.retrievePublicSlotsFromDB(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Slots retrieved successfully",
      data: result.slots,
      meta: result.pagination,
    });
  });

  adminRetrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.slotService.adminRetrieveSlotsFromDB(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Slots retrieved successfully",
      data: result.slots,
      meta: result.pagination,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const result = await this.slotService.updateSlotInDB(
      req.params.id as string,
      req.body
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Slot updated successfully",
      data: result,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.slotService.deleteSlotFromDB(req.params.id as string);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Slot deleted successfully",
    });
  });
}
