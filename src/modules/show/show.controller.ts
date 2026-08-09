import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ShowService } from "./show.service";

export class ShowController {
  private showService = new ShowService();

  create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.showService.createShowToDB({
      admin_id: req.user?.user_id,
      ...req.body,
    });
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Show created successfully",
      data: result,
    });
  });

  retrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.showService.retrievePublicShowsFromDB(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Shows retrieved successfully",
      data: result.shows,
      meta: result.pagination,
    });
  });

  adminRetrieve = catchAsync(async (req: Request, res: Response) => {
    const result = await this.showService.adminRetrieveShowsFromDB(req.query);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Shows retrieved successfully",
      data: result.shows,
      meta: result.pagination,
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const result = await this.showService.updateShowInDB(
      req.params.id as string,
      req.body
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Show updated successfully",
      data: result,
    });
  });

  delete = catchAsync(async (req: Request, res: Response) => {
    await this.showService.deleteShowFromDB(req.params.id as string);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Show deleted successfully",
    });
  });
}
