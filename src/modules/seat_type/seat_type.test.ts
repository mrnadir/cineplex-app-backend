import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";
import { SEAT_TYPE_STATUS } from "../../enums";

jest.mock("./seat_type.repository", () => ({
  SeatTypeRepository: jest.fn(),
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

import { SeatTypeService } from "./seat_type.service";
import { SeatTypeRepository } from "./seat_type.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";

const MockSeatTypeRepository = SeatTypeRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("SeatTypeService", () => {
  let seatTypeService: SeatTypeService;

  let mockRepo: {
    create: jest.Mock;
    adminRetrieve: jest.Mock;
    checkUniqueByType: jest.Mock;
    deleteById: jest.Mock;
  };

  let mockRedis: {
    keyDelete: jest.Mock;
    hget: jest.Mock;
    hset: jest.Mock;
  };

  const sampleSeatType = {
    id: 1,
    admin_id: 1,
    name: SEAT_TYPE_STATUS.Regular,
    description: "Standard seating with basic comfort",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      adminRetrieve: jest.fn(),
      checkUniqueByType: jest.fn(),
      deleteById: jest.fn(),
    };

    mockRedis = {
      keyDelete: jest.fn(),
      hget: jest.fn(),
      hset: jest.fn(),
    };

    MockSeatTypeRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    seatTypeService = new SeatTypeService();
  });

  describe("createToDB", () => {
    it("should create a seat type when name is unique", async () => {
      mockRepo.checkUniqueByType.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(sampleSeatType);

      const result = await seatTypeService.createToDB({
        admin_id: 1,
        name: SEAT_TYPE_STATUS.Regular,
        description: "Standard seating with basic comfort",
      });

      expect(result).toEqual(sampleSeatType);
      expect(mockRepo.checkUniqueByType).toHaveBeenCalledWith(
        SEAT_TYPE_STATUS.Regular
      );
      expect(mockRepo.create).toHaveBeenCalledWith({
        admin_id: 1,
        name: SEAT_TYPE_STATUS.Regular,
        description: "Standard seating with basic comfort",
      });
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_types:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_types:admin");
    });

    it("should throw an error when seat type name already exists", async () => {
      mockRepo.checkUniqueByType.mockResolvedValue(sampleSeatType);

      await expect(
        seatTypeService.createToDB({
          admin_id: 1,
          name: SEAT_TYPE_STATUS.Regular,
          description: "Standard seating with basic comfort",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: "A seat type with this name already exists",
      } satisfies Partial<ApiError>);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it("should throw an error when repository fails to create", async () => {
      mockRepo.checkUniqueByType.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(undefined);

      await expect(
        seatTypeService.createToDB({
          admin_id: 1,
          name: SEAT_TYPE_STATUS.VIP,
          description: "Premium VIP seating",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Failed to create seat type",
      } satisfies Partial<ApiError>);
    });
  });

  describe("retrieveAdminSeatTypesFromDB", () => {
    it("should retrieve seat types from cache if available", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const cachedSeatTypes = {
        seatTypes: [sampleSeatType],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(cachedSeatTypes);

      const result = await seatTypeService.retrieveAdminSeatTypesFromDB({});

      expect(result).toEqual(cachedSeatTypes);
      expect(mockRepo.adminRetrieve).not.toHaveBeenCalled();
    });

    it("should retrieve seat types from DB and cache them if not in cache", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const dbResult = {
        seatTypes: [sampleSeatType],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.adminRetrieve.mockResolvedValue(dbResult);

      const result = await seatTypeService.retrieveAdminSeatTypesFromDB({});

      expect(result).toEqual(dbResult);
      expect(mockRepo.adminRetrieve).toHaveBeenCalledWith({});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "seat_types:admin",
        {},
        dbResult,
        600
      );
    });
  });

  describe("deleteFromDB", () => {
    it("should delete a seat type successfully", async () => {
      mockRepo.deleteById.mockResolvedValue(true);

      const result = await seatTypeService.deleteFromDB(1);

      expect(result).toBe(true);
      expect(mockRepo.deleteById).toHaveBeenCalledWith(1);
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_types:public");
      expect(mockRedis.keyDelete).toHaveBeenCalledWith("seat_types:admin");
    });

    it("should throw an error when seat type is already inactive", async () => {
      mockRepo.deleteById.mockResolvedValue(false);

      await expect(seatTypeService.deleteFromDB(1)).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Seat Type is already inactive",
      } satisfies Partial<ApiError>);

      expect(mockRedis.keyDelete).not.toHaveBeenCalled();
    });
  });
});
