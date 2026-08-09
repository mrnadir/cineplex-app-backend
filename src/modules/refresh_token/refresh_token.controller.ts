import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import getDeviceInfo from "../../utils/getDeviceInfo";
import { getClientIp, getLocationFromIp } from "../../utils/getLocationFromIp";
import config from "../../config";
import { RefreshTokenService } from "./refresh_token.service";
import { TokenService } from "../../utils/token";

export class RefreshTokenController {
  private refreshTokenService: RefreshTokenService;
  private tokenService: TokenService;

  constructor() {
    this.refreshTokenService = new RefreshTokenService();
    this.tokenService = new TokenService();
  }

  regenarateToken = catchAsync(async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"] || "";
    const deviceInfo = getDeviceInfo(userAgent);
    const ip = getClientIp(req);
    const location = getLocationFromIp("72.167.221.185");

    const refreshToken = req?.cookies?.refreshToken;

    const payload = {
      ip_address: ip,
      device_info: deviceInfo,
      city: location.city,
    };

    const result = await this.refreshTokenService.regenerateToken(
      refreshToken,
      payload
    );
    const csrfToken = this.tokenService.csrfToken();

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      sameSite: config.cookie.samesite === "none" ? "none" : "lax",
      secure: config.cookie.secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie("csrfToken", csrfToken, {
      httpOnly: false,
      sameSite: config.cookie.samesite === "none" ? "none" : "lax",
      secure: config.cookie.secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Logged in successfully",
      data: result,
    });
  });

  revokeToken = catchAsync(async (req: Request, res: Response) => {
    const result = await this.refreshTokenService.revokeToken(
      Number(req.params.id),
      req.body.user_id
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "This device rebuke successfully",
      data: result,
    });
  });
}
