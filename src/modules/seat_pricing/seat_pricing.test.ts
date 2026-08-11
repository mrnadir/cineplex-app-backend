import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";

jest.mock("./seat_pricing.repository", () => ({
  SeatPricingRepository: jest.fn(),
}));

jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));

jest.mock("../../shared/logger", () => ({
  __esModule: true,
  default: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

import { SeatPricingService } from "./seat_pricing.service";
import { SeatPricingRepository } from "./seat_pricing.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";

const MockSeatPricingRepository = SeatPricingRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("SeatPricingService", () => {
  let seatPricingService: SeatPricingService;

  let mockRepo: {
    create: jest.Mock;
    adminRetrieve: jest.Mock;
    checkUniqueBySlotSeatTypeAndPrice: jest.Mock;
    findById: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };

  let mockRedis: {
    keyDelete: jest.Mock;
    hget: jest.Mock;
    hset: jest.Mock;
  };

  const sampleSeatPricing = {
    id: 1,
    admin_id: 1,
    slot_id: 1,
    seat_type_id: 1,
    price: 500,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      adminRetrieve: jest.fn(),
      checkUniqueBySlotSeatTypeAndPrice: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    mockRedis = {
      keyDelete: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
    };

    MockSeatPricingRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    seatPricingService = new SeatPricingService();
  });

  describe("createToDB", () => {
    it("should create a seat pricing when slot, seat type, and price combination is unique", async () => {
      mockRepo.checkUniqueBySlotSeatTypeAndPrice.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(sampleSeatPricing);

      const result = await seatPricingService.createToDB({
        admin_id: 1,
        slot_id: 1,
        seat_type_id: 1,
        price: 500,
      });

      expect(result).toEqual(sampleSeatPricing);
      expect(mockRepo.checkUniqueBySlotSeatTypeAndPrice).toHaveBeenCalledWith(
        1,
        1,
        500
      );
      expect(mockRepo.create).toHaveBeenCalledWith({
        admin_id: 1,
        slot_id: 1,
        seat_type_id: 1,
        price: 500,
      });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_pricings:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_pricings:admin");
    });

    it("should throw an error when seat pricing combination already exists", async () => {
      mockRepo.checkUniqueBySlotSeatTypeAndPrice.mockResolvedValue(
        sampleSeatPricing
      );

      await expect(
        seatPricingService.createToDB({
          admin_id: 1,
          slot_id: 1,
          seat_type_id: 1,
          price: 500,
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message:
          "A seat pricing with this slot, seat type, and price already exists",
      } satisfies Partial<ApiError>);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should throw an error when repository fails to create", async () => {
      mockRepo.checkUniqueBySlotSeatTypeAndPrice.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(undefined);

      await expect(
        seatPricingService.createToDB({
          admin_id: 1,
          slot_id: 1,
          seat_type_id: 2,
          price: 800,
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Failed to create seat pricing",
      } satisfies Partial<ApiError>);
    });
  });

  describe("retrieveAdminSeatPricingsFromDB", () => {
    it("should retrieve seat pricings from cache if available", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const cachedSeatPricings = {
        seatPricings: [sampleSeatPricing],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(cachedSeatPricings);

      const result = await seatPricingService.retrieveAdminSeatPricingsFromDB(
        {}
      );

      expect(result).toEqual(cachedSeatPricings);
      expect(mockRepo.adminRetrieve).not.toHaveBeenCalled();
    });

    it("should retrieve seat pricings from DB and cache them if not in cache", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const dbResult = {
        seatPricings: [sampleSeatPricing],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.adminRetrieve.mockResolvedValue(dbResult);

      const result = await seatPricingService.retrieveAdminSeatPricingsFromDB(
        {}
      );

      expect(result).toEqual(dbResult);
      expect(mockRepo.adminRetrieve).toHaveBeenCalledWith({});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "seat_pricings:admin",
        {},
        dbResult,
        600
      );
    });
  });

  describe("updateInDB", () => {
    it("should update a seat pricing successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleSeatPricing);
      mockRepo.checkUniqueBySlotSeatTypeAndPrice.mockResolvedValue(null);
      mockRepo.updateById.mockResolvedValue({
        ...sampleSeatPricing,
        price: 800,
      });

      const result = await seatPricingService.updateInDB("1", { price: 800 });

      expect(result).toEqual({
        ...sampleSeatPricing,
        price: 800,
      });
      expect(mockRepo.findById).toHaveBeenCalledWith(1);
      expect(mockRepo.checkUniqueBySlotSeatTypeAndPrice).toHaveBeenCalledWith(
        1,
        1,
        800,
        1
      );
      expect(mockRepo.updateById).toHaveBeenCalledWith(1, { price: 800 });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_pricings:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_pricings:admin");
    });

    it("should throw an error when the seat pricing is not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        seatPricingService.updateInDB("999", { price: 800 })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Seat Pricing not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.updateById).not.toHaveBeenCalled();
    });

    it("should throw an error when updated combination already exists", async () => {
      mockRepo.findById.mockResolvedValue(sampleSeatPricing);
      mockRepo.checkUniqueBySlotSeatTypeAndPrice.mockResolvedValue({
        ...sampleSeatPricing,
        id: 2,
      });

      await expect(
        seatPricingService.updateInDB("1", { price: 800 })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message:
          "A seat pricing with this slot, seat type, and price already exists",
      } satisfies Partial<ApiError>);

      expect(mockRepo.updateById).not.toHaveBeenCalled();
    });

    it("should throw an error when repository fails to update", async () => {
      mockRepo.findById.mockResolvedValue(sampleSeatPricing);
      mockRepo.checkUniqueBySlotSeatTypeAndPrice.mockResolvedValue(null);
      mockRepo.updateById.mockResolvedValue(null);

      await expect(
        seatPricingService.updateInDB("1", { price: 800 })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Failed to update seat pricing",
      } satisfies Partial<ApiError>);

      expect(mockRedis.keyDelete).not.toHaveBeenCalled();
    });
  });

  describe("deleteFromDB", () => {
    it("should delete a seat pricing successfully", async () => {
      mockRepo.deleteById.mockResolvedValue(true);

      const result = await seatPricingService.deleteFromDB(1);

      expect(result).toBe(true);
      expect(mockRepo.deleteById).toHaveBeenCalledWith(1);
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_pricings:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_pricings:admin");
    });

    it("should throw an error when seat pricing is already inactive", async () => {
      mockRepo.deleteById.mockResolvedValue(false);

      await expect(seatPricingService.deleteFromDB(1)).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Seat Pricing is already inactive",
      } satisfies Partial<ApiError>);

      expect(mockRedis.keyDelete).not.toHaveBeenCalled();
    });
  });
});
