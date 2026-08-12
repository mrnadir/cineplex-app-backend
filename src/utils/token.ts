import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { USER_ROLES } from "../enums";
import { RefreshTokenRepository } from "../modules/refresh_token/refresh_token.repository";
import config from "../config";
import { ICreateRefreshToken } from "../modules/refresh_token/refresh_token.interface";

export interface ITokenPayload {
  user_id: number;
  role: USER_ROLES;
  jti?: string;
}

interface IRefreshTokenPayload {
  email: string;
  password: string;
  user_id: number;
  role?: USER_ROLES;
  device_info: string;
  ip_address: string;
  city: string;
}

export class TokenService {
  private readonly ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
  private readonly REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
  private readonly ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN!;
  private readonly REFRESH_EXPIRES_DAYS = process.env.JWT_REFRESH_EXPIRES_DAYS!;
  private refreshTokenRepository = new RefreshTokenRepository();

  generateAccessToken(payload: ITokenPayload): string {
    const options: SignOptions = {
      expiresIn: this.ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, this.ACCESS_SECRET, options);
  }

  async generateRefreshToken(
    payload: Partial<IRefreshTokenPayload>
  ): Promise<string> {
    const options: SignOptions = {
      expiresIn: this.REFRESH_EXPIRES_DAYS as SignOptions["expiresIn"],
    };
    const jti = crypto.randomUUID();

    const days = parseInt(config.jwt.refreshExpiresDays, 10);
    const expired_at = new Date();
    expired_at.setDate(expired_at.getDate() + days);

    const refresh_token = jwt.sign(
      { user_id: payload.user_id, role: payload.role, jti },
      this.REFRESH_SECRET,
      options
    );

    const refresh_token_payload: ICreateRefreshToken = {
      user_id: Number(payload.user_id),
      token_hash: this.hash(refresh_token),
      expires_at: expired_at,
      device_info: payload?.device_info ?? "unknown",
      ip_address: payload.ip_address ?? "unknown",
      jti: jti,
      city: payload.city ?? "unknown",
    };

    await this.refreshTokenRepository.create(refresh_token_payload);
    return refresh_token;
  }

  verifyAccessToken(token: string): ITokenPayload {
    return jwt.verify(token, this.ACCESS_SECRET) as ITokenPayload;
  }

  hash(refreshToken: string): string {
    return crypto.createHash("sha256").update(refreshToken).digest("hex");
  }

  verifyRefreshToken(token: string): ITokenPayload {
    return jwt.verify(token, this.REFRESH_SECRET) as ITokenPayload;
  }

  generateResetToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  csrfToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
