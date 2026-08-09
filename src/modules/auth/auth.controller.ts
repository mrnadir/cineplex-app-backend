import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthService } from "./auth.service";
import getDeviceInfo from "../../utils/getDeviceInfo";
import { getClientIp, getLocationFromIp } from "../../utils/getLocationFromIp";
import config from "../../config";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = catchAsync(async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "";
    const deviceInfo = getDeviceInfo(userAgent);
    const ip = getClientIp(req);
    const location = getLocationFromIp("72.167.221.185");

    const payload = {
      ...req.body,
      ip_address: ip,
      device_info: deviceInfo,
      city: location.city,
    };

    const result = await this.authService.login(payload);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: config.cookie.samesite === "none" ? "none" : "lax",
      secure: config.cookie.secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie("csrfToken", result.csrfToken, {
      httpOnly: false,
      sameSite: config.cookie.samesite === "none" ? "none" : "lax",
      secure: config.cookie.secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Logged in successfully",
      data: result,
    });
  });

  forgotPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.forgotPassword(req.body.email);
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Your forgot password request take successfully.",
      data: result,
    });
  });

  resetPassword = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.resetPassword(req.body);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Your Password reset successfully.",
      data: result,
    });
  });

  verifyOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.verifyOtpFromDB(
      req.body.email,
      req.body.otp,
      req.body.purpose
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "OTP verify successfully",
      data: result,
    });
  });

  resendOtp = catchAsync(async (req: Request, res: Response) => {
    const result = await this.authService.resentOtpToDB(req.body);

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Otp resend successfully",
      data: result,
    });
  });

  deleteAccount = catchAsync(async (req: Request, res: Response) => {
    await this.authService.deleteAccount(Number(req?.user?.user_id));
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Account Deleted request submitted successfully.",
    });
  });

  recoveryAccount = catchAsync(async (req: Request, res: Response) => {
    await this.authService.recoveryAccount(req.body.email);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Account Deleted request submitted successfully.",
    });
  });
}
