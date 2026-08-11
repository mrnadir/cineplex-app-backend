import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { IPagination } from "../../types/pagination";
import parseId from "../../shared/parseId";
import logger from "../../shared/logger";
import { SeatPricingRepository } from "./seat_pricing.repository";
import {
  ICreateSeatPricing,
  ISeatPricing,
  IUpdateSeatPricing,
} from "./seat_pricing.interface";

export class SeatPricingService {
  private seatPricingRepository = new SeatPricingRepository();
  private redisHelper = new RedisHelper();

  async createToDB(data: ICreateSeatPricing) {
    const existing =
      await this.seatPricingRepository.checkUniqueBySlotSeatTypeAndPrice(
        data.slot_id,
        data.seat_type_id,
        data.price
      );
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "A seat pricing with this slot, seat type, and price already exists"
      );
    }

    const seatPricing = await this.seatPricingRepository.create(data);
    if (!seatPricing) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Failed to create seat pricing"
      );
    }
    await this.redisHelper.keyDelete("seat_pricings:public");
    await this.redisHelper.keyDelete("seat_pricings:admin");
    return seatPricing;
  }

  async retrieveAdminSeatPricingsFromDB(query: Partial<ISeatPricing>) {
    const cacheKey = "seat_pricings:admin";
    const CACHE_TTL = 600; // 10 minutes

    try {
      const cached = await this.redisHelper.hget<{
        seatPricings: Partial<ISeatPricing>[];
        pagination: IPagination;
      }>(cacheKey, query);
      if (cached) {
        return cached;
      }
    } catch (err) {
      logger.warn({ err }, "Redis get failed, falling back to DB");
    }
    const seat_pricings = await this.seatPricingRepository.adminRetrieve(query);

    try {
      await this.redisHelper.hset(cacheKey, query, seat_pricings, CACHE_TTL);
    } catch (err) {
      logger.warn({ err }, "Redis set failed");
    }
    return seat_pricings;
  }

  async updateInDB(id: string, data: IUpdateSeatPricing) {
    const seatPricingId = parseId(id, "Seat Pricing id");
    const existing = await this.seatPricingRepository.findById(seatPricingId);
    if (!existing) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Seat Pricing not found");
    }

    const slot_id = data.slot_id ?? existing.slot_id;
    const seat_type_id = data.seat_type_id ?? existing.seat_type_id;
    const price = data.price ?? existing.price;

    const duplicate =
      await this.seatPricingRepository.checkUniqueBySlotSeatTypeAndPrice(
        slot_id,
        seat_type_id,
        price,
        seatPricingId
      );
    if (duplicate) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "A seat pricing with this slot, seat type, and price already exists"
      );
    }

    const updatedSeatPricing = await this.seatPricingRepository.updateById(
      seatPricingId,
      data
    );
    if (!updatedSeatPricing) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Failed to update seat pricing"
      );
    }

    await this.redisHelper.keyDelete("seat_pricings:public");
    await this.redisHelper.keyDelete("seat_pricings:admin");
    return updatedSeatPricing;
  }

  async deleteFromDB(seat_pricing_id: number) {
    const result = await this.seatPricingRepository.deleteById(seat_pricing_id);
    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Seat Pricing is already inactive"
      );
    }

    await this.redisHelper.keyDelete("seat_pricings:public");
    await this.redisHelper.keyDelete("seat_pricings:admin");
    return result;
  }
}
