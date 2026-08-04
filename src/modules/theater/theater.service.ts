import { TheaterRepository } from "./theater.repository";
import { ICreateTheater, ITheater, IUpdateTheater } from "./theater.interface";
import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { IPagination } from "../../types/pagination";
import parseId from "../../shared/parseId";
import logger from "../../shared/logger";

export class TheaterService {
  private theaterRepository = new TheaterRepository();
  private redisHelper = new RedisHelper();

  async createToDB(data: ICreateTheater) {
    const existing = await this.theaterRepository.findByCode(data.code);
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "A theater with this code already exists"
      );
    }

    const theater = await this.theaterRepository.create(data);
    if (!theater) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create theater");
    }
    await this.redisHelper.keyDelete("theaters:public");
    await this.redisHelper.keyDelete("theaters:admin");
    return theater;
  }

  async retrieveFromDB(query: Partial<ITheater>) {
    const cacheKey = "theaters:public";
    const CACHE_TTL = 600; // 10 minutes

    try {
      const cached = await this.redisHelper.hget<{
        theaters: Partial<ITheater>[];
        pagination: IPagination;
      }>(cacheKey, query);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn({ err }, "Redis get failed, falling back to DB");
    }
    const theaters = await this.theaterRepository.retrieve(query);

    try {
      await this.redisHelper.hset(cacheKey, query, theaters, CACHE_TTL);
    } catch (err) {
      logger.warn({ err }, "Redis set failed");
    }
    return theaters;
  }

  async adminRetrieveFromDB(query: Partial<ITheater>) {
    const cacheKey = "theaters:admin";
    const CACHE_TTL = 600; // 10 minutes

    try {
      const cached = await this.redisHelper.hget<{
        theaters: Partial<ITheater>[];
        pagination: IPagination;
      }>(cacheKey, query);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn({ err }, "Redis get failed, falling back to DB");
    }
    const theaters = await this.theaterRepository.adminRetrieve(query);

    try {
      await this.redisHelper.hset(cacheKey, query, theaters, CACHE_TTL);
    } catch (err) {
      logger.warn({ err }, "Redis set failed");
    }
    return theaters;
  }

  async getByIdFromDB(id: string) {
    const theaterId = parseId(id, "theater id");

    const theater = await this.theaterRepository.findById(theaterId);
    if (!theater) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Theater not found");
    }

    return theater;
  }

  async updateToDB(id: string, data: IUpdateTheater) {
    const theaterId = parseId(id, "theater id");

    const existing = await this.theaterRepository.findById(theaterId);
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Theater not found");
    }

    // Code bodlale onno theater-er sathe conflict kina dekhi (nijeke baad diye).
    if (data.code) {
      const byCode = await this.theaterRepository.findByCode(data.code);
      if (byCode && byCode.id !== theaterId) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          "A theater with this code already exists"
        );
      }
    }

    const updated = await this.theaterRepository.update(theaterId, data);
    if (!updated) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update theater");
    }
    await this.redisHelper.keyDelete("theaters:public");
    await this.redisHelper.keyDelete("theaters:admin");
    return updated;
  }

  async deleteFromDB(id: string) {
    const theaterId = parseId(id, "theater id");

    const existing = await this.theaterRepository.findById(theaterId);
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Theater not found");
    }

    const ok = await this.theaterRepository.softDelete(theaterId);
    if (!ok) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Theater is already inactive"
      );
    }

    await this.redisHelper.keyDelete("theaters:public");
    await this.redisHelper.keyDelete("theaters:admin");
    return existing;
  }
}
