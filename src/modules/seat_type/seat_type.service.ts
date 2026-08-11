import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { IPagination } from "../../types/pagination";
import logger from "../../shared/logger";
import { SeatTypeRepository } from "./seat_type.repository";
import { ICreateSeatType, ISeatType } from "./seat_type.interface";

export class SeatTypeService {
  private seatTypeRepository = new SeatTypeRepository();
  private redisHelper = new RedisHelper();

  async createToDB(data: ICreateSeatType) {
    const existing = await this.seatTypeRepository.checkUniqueByType(data.name);
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "A seat type with this name already exists"
      );
    }

    const seatType = await this.seatTypeRepository.create(data);
    if (!seatType) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to create seat type");
    }
    await this.redisHelper.keyDelete("seat_types:public");
    await this.redisHelper.keyDelete("seat_types:admin");
    return seatType;
  }

  async retrieveAdminSeatTypesFromDB(query: Partial<ISeatType>) {
    const cacheKey = "seat_types:admin";
    const CACHE_TTL = 600; // 10 minutes

    try {
      const cached = await this.redisHelper.hget<{
        seatTypes: Partial<ISeatType>[];
        pagination: IPagination;
      }>(cacheKey, query);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn({ err }, "Redis get failed, falling back to DB");
    }
    const seat_types = await this.seatTypeRepository.adminRetrieve(query);

    try {
      await this.redisHelper.hset(cacheKey, query, seat_types, CACHE_TTL);
    } catch (err) {
      logger.warn({ err }, "Redis set failed");
    }
    return seat_types;
  }

  async deleteFromDB(seat_type_id: number) {
    const result = await this.seatTypeRepository.deleteById(seat_type_id);
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Seat Type is already inactive"
      );
    }

    await this.redisHelper.keyDelete("seat_types:public");
    await this.redisHelper.keyDelete("seat_types:admin");
    return result;
  }
}
