import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";

jest.mock("./slot.repository", () => ({
  SlotRepository: jest.fn(),
}));

jest.mock("../../shared/redis/redis.helper", () => ({
  RedisHelper: jest.fn(),
}));

import { SlotService } from "./slot.service";
import { SlotRepository } from "./slot.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";

const MockSlotRepository = SlotRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("SlotService", () => {
  let slotService: SlotService;

  let mockRepo: {
    uniqueByTheaterAndMovie: jest.Mock;
    create: jest.Mock;
    retrieve: jest.Mock;
    findById: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
  };

  let mockRedis: {
    hget: jest.Mock;
    hset: jest.Mock;
    hKeyDelete: jest.Mock;
  };

  const sampleSlot = {
    id: 1,
    admin_id: 1,
    show_id: 10,
    slot_time: "18:30",
    is_active: "active",
    created_at: "2026-08-08T10:00:00.000Z",
    updated_at: "2026-08-08T10:00:00.000Z",
  };

  beforeEach(() => {
    mockRepo = {
      uniqueByTheaterAndMovie: jest.fn(),
      create: jest.fn(),
      retrieve: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
    };

    mockRedis = {
      hget: jest.fn(),
      hset: jest.fn(),
      hKeyDelete: jest.fn(),
    };

    MockSlotRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    slotService = new SlotService();
  });

  describe("createSlotToDB", () => {
    it("should create a slot when the slot is unique", async () => {
      mockRepo.uniqueByTheaterAndMovie.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(sampleSlot);

      const result = await slotService.createSlotToDB({
        admin_id: 1,
        show_id: 10,
        slot_time: "18:30",
      });

      expect(result).toEqual(sampleSlot);
      expect(mockRepo.uniqueByTheaterAndMovie).toHaveBeenCalledWith(
        10,
        "18:30"
      );
      expect(mockRepo.create).toHaveBeenCalledWith({
        admin_id: 1,
        show_id: 10,
        slot_time: "18:30",
      });
    });

    it("should throw an error when the slot already exists", async () => {
      mockRepo.uniqueByTheaterAndMovie.mockResolvedValue(sampleSlot);

      await expect(
        slotService.createSlotToDB({
          admin_id: 1,
          show_id: 10,
          slot_time: "18:30",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: "A slot with this show id already exists",
      } satisfies Partial<ApiError>);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("retrievePublicSlotsFromDB", () => {
    it("should retrieve slots from cache if available", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const cachedSlots = {
        slots: [sampleSlot],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(cachedSlots);

      const result = await slotService.retrievePublicSlotsFromDB({});

      expect(result).toEqual(cachedSlots);
      expect(mockRepo.retrieve).not.toHaveBeenCalled();
    });

    it("should retrieve slots from DB and cache them if not in cache", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const dbResult = {
        slots: [sampleSlot],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrieve.mockResolvedValue(dbResult);

      const result = await slotService.retrievePublicSlotsFromDB({});

      expect(result).toEqual(dbResult);
      expect(mockRepo.retrieve).toHaveBeenCalledWith({});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "slots:public",
        {},
        dbResult,
        3600
      );
    });
  });

  describe("adminRetrieveSlotsFromDB", () => {
    it("should retrieve admin slots from cache if available", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const cachedSlots = {
        slots: [sampleSlot],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(cachedSlots);

      const result = await slotService.adminRetrieveSlotsFromDB({});

      expect(result).toEqual(cachedSlots);
      expect(mockRepo.retrieve).not.toHaveBeenCalled();
    });

    it("should retrieve admin slots from DB and cache them if not in cache", async () => {
      const samplePagination = { page: 1, limit: 10, total: 1 };
      const dbResult = {
        slots: [sampleSlot],
        pagination: samplePagination,
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrieve.mockResolvedValue(dbResult);

      const result = await slotService.adminRetrieveSlotsFromDB({});

      expect(result).toEqual(dbResult);
      expect(mockRepo.retrieve).toHaveBeenCalledWith({});
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "slots:admin",
        {},
        dbResult,
        3600
      );
    });
  });

  describe("updateSlotInDB", () => {
    it("should update a slot successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleSlot);
      mockRepo.updateById.mockResolvedValue({
        ...sampleSlot,
        slot_time: "20:00",
      });

      const result = await slotService.updateSlotInDB("1", {
        slot_time: "20:00",
      });

      expect(result).toEqual({
        ...sampleSlot,
        slot_time: "20:00",
      });
      expect(mockRepo.updateById).toHaveBeenCalledWith(1, {
        slot_time: "20:00",
      });
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("slots:admin");
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("slots:public");
    });

    it("should throw an error when the slot is not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        slotService.updateSlotInDB("999", { slot_time: "20:00" })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Slot not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.updateById).not.toHaveBeenCalled();
    });
  });

  describe("deleteSlotFromDB", () => {
    it("should delete a slot successfully", async () => {
      mockRepo.findById.mockResolvedValue(sampleSlot);
      mockRepo.deleteById.mockResolvedValue(true);

      const result = await slotService.deleteSlotFromDB("1");

      expect(result).toEqual({ message: "Slot deleted successfully" });
      expect(mockRepo.deleteById).toHaveBeenCalledWith(1);
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("slots:admin");
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("slots:public");
    });

    it("should throw an error when the slot is not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(slotService.deleteSlotFromDB("999")).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Slot not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.deleteById).not.toHaveBeenCalled();
    });
  });
});
