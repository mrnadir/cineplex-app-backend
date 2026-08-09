import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/ApiErrors";

jest.mock("./show.repository", () => ({
  ShowRepository: jest.fn(),
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

import { ShowService } from "./show.service";
import { ShowRepository } from "./show.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";

const MockShowRepository = ShowRepository as unknown as jest.Mock;
const MockRedisHelper = RedisHelper as unknown as jest.Mock;

describe("ShowService", () => {
  let showService: ShowService;

  let mockRepo: {
    create: jest.Mock;
    retrieve: jest.Mock;
    findById: jest.Mock;
    updateById: jest.Mock;
    deleteById: jest.Mock;
    uniqueByTheaterAndMovie: jest.Mock;
  };

  let mockRedis: {
    hget: jest.Mock;
    hset: jest.Mock;
    hKeyDelete: jest.Mock;
  };

  const sampleShow = {
    id: 1,
    admin_id: 1,
    theater_id: 10,
    movie_id: 20,
    show_date: "2026-08-09",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      retrieve: jest.fn(),
      findById: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      uniqueByTheaterAndMovie: jest.fn(),
    };

    mockRedis = {
      hget: jest.fn(),
      hset: jest.fn(),
      hKeyDelete: jest.fn(),
    };

    MockShowRepository.mockImplementation(() => mockRepo);
    MockRedisHelper.mockImplementation(() => mockRedis);

    showService = new ShowService();
  });

  describe("createShowToDB", () => {
    it("should create a show when theater and movie combination is unique", async () => {
      mockRepo.uniqueByTheaterAndMovie.mockResolvedValue(null);
      mockRepo.create.mockResolvedValue(sampleShow);

      const result = await showService.createShowToDB({
        admin_id: 1,
        theater_id: 10,
        movie_id: 20,
        show_date: "2026-08-09",
      });

      expect(result).toEqual(sampleShow);
      expect(mockRepo.create).toHaveBeenCalledWith({
        admin_id: 1,
        theater_id: 10,
        movie_id: 20,
        show_date: "2026-08-09",
      });
    });

    it("should throw 409 if a show already exists for the same theater and movie", async () => {
      mockRepo.uniqueByTheaterAndMovie.mockResolvedValue(sampleShow);

      await expect(
        showService.createShowToDB({
          admin_id: 1,
          theater_id: 10,
          movie_id: 20,
          show_date: "2026-08-09",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: "A show with this theater and movie already exists",
      } satisfies Partial<ApiError>);

      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("retrievePublicShowsFromDB", () => {
    it("should return cached data without querying the repository", async () => {
      const query = { theater_id: 10, movie_id: 20 };
      const cachedResult = {
        shows: [sampleShow],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(cachedResult);

      const result = await showService.retrievePublicShowsFromDB(query);

      expect(result).toEqual(cachedResult);
      expect(mockRepo.retrieve).not.toHaveBeenCalled();
    });

    it("should query DB and cache results when cache is missing", async () => {
      const query = { theater_id: 10, movie_id: 20 };
      const dbResult = {
        shows: [sampleShow],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrieve.mockResolvedValue(dbResult);

      const result = await showService.retrievePublicShowsFromDB(query);

      expect(result).toEqual(dbResult);
      expect(mockRepo.retrieve).toHaveBeenCalledWith(query);
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "shows:public",
        query,
        dbResult,
        3600
      );
    });
  });

  describe("adminRetrieveShowsFromDB", () => {
    it("should return cached admin data without querying the repository", async () => {
      const query = { status: true };
      const cachedResult = {
        shows: [sampleShow],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(cachedResult);

      const result = await showService.adminRetrieveShowsFromDB(query);

      expect(result).toEqual(cachedResult);
      expect(mockRepo.retrieve).not.toHaveBeenCalled();
    });

    it("should query DB and cache admin results when cache is missing", async () => {
      const query = { status: true };
      const dbResult = {
        shows: [sampleShow],
        pagination: { page: 1, limit: 10, total: 1 },
      };
      mockRedis.hget.mockResolvedValue(null);
      mockRepo.retrieve.mockResolvedValue(dbResult);

      const result = await showService.adminRetrieveShowsFromDB(query);

      expect(result).toEqual(dbResult);
      expect(mockRepo.retrieve).toHaveBeenCalledWith(query);
      expect(mockRedis.hset).toHaveBeenCalledWith(
        "shows:admin",
        query,
        dbResult,
        3600
      );
    });
  });

  describe("updateShowInDB", () => {
    it("should update an existing show and clear the admin cache", async () => {
      const payload = {
        theater_id: 11,
        movie_id: 21,
        show_date: "2026-08-10",
        status: "active",
      } as const;
      const updatedShow = { ...sampleShow, ...payload };

      mockRepo.findById.mockResolvedValue(sampleShow);
      mockRepo.updateById.mockResolvedValue(updatedShow);

      const result = await showService.updateShowInDB("1", payload);

      expect(result).toEqual(updatedShow);
      expect(mockRepo.updateById).toHaveBeenCalledWith(1, payload);
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("shows:admin");
    });

    it("should throw 404 if the show does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(
        showService.updateShowInDB("999", {
          theater_id: 11,
          movie_id: 21,
          show_date: "2026-08-10",
          status: "active",
        })
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Show not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.updateById).not.toHaveBeenCalled();
    });
  });

  describe("deleteShowFromDB", () => {
    it("should delete an existing show and clear the admin cache", async () => {
      mockRepo.findById.mockResolvedValue(sampleShow);
      mockRepo.deleteById.mockResolvedValue(true);

      const result = await showService.deleteShowFromDB("1");

      expect(result).toEqual({ message: "Show deleted successfully" });
      expect(mockRepo.deleteById).toHaveBeenCalledWith(1);
      expect(mockRedis.hKeyDelete).toHaveBeenCalledWith("shows:admin");
    });

    it("should throw 404 if the show does not exist", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(showService.deleteShowFromDB("999")).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: "Show not found",
      } satisfies Partial<ApiError>);

      expect(mockRepo.deleteById).not.toHaveBeenCalled();
    });
  });
});
