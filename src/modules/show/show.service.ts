import { StatusCodes } from "http-status-codes";
import { ShowRepository } from "./show.repository";
import { RedisHelper } from "../../shared/redis/redis.helper";
import { ICreateShow, IShow } from "./show.interface";
import ApiError from "../../errors/ApiErrors";
import { IPagination } from "../../types/pagination";

export class ShowService {
  private showRepository = new ShowRepository();
  private redisHelper = new RedisHelper();

  constructor() {}

  // Create a new show in the database, ensuring uniqueness by theater and movie combination
  async createShowToDB(data: ICreateShow) {
    const existing = await this.showRepository.uniqueByTheaterAndMovie(
      data.theater_id,
      data.movie_id
    );
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "A show with this theater and movie already exists"
      );
    }
    const show = await this.showRepository.create(data);
    return show;
  }

  // Retrieve shows from the database with caching support
  async retrievePublicShowsFromDB(query: Record<string, any>) {
    const cached = await this.redisHelper.hget<{
      shows: IShow[];
      pagination: IPagination;
    }>("shows:public", query);

    if (cached) {
      return cached;
    }
    const result = await this.showRepository.retrieve(query);
    const ttl = result.shows.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("shows:public", query, result, ttl);
    return result;
  }

  // Admin retrieve shows from the database with caching support
  async adminRetrieveShowsFromDB(query: Record<string, any>) {
    const cached = await this.redisHelper.hget<{
      shows: IShow[];
      pagination: IPagination;
    }>("shows:admin", query);
    if (cached) {
      return cached;
    }
    const result = await this.showRepository.retrieve(query);
    const ttl = result.shows.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("shows:admin", query, result, ttl);
    return result;
  }

  // update a show in the database by id
  async updateShowInDB(id: string, data: any) {
    const findingShow = await this.showRepository.findById(Number(id));
    if (!findingShow) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Show not found");
    }
    const updatedShow = await this.showRepository.updateById(Number(id), data);
    if (!updatedShow) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update show");
    }
    await this.redisHelper.hKeyDelete("shows:admin");
    return updatedShow;
  }

  // delete a show from the database by id
  async deleteShowFromDB(id: string) {
    const findingShow = await this.showRepository.findById(Number(id));
    if (!findingShow) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Show not found");
    }
    const deleted = await this.showRepository.deleteById(Number(id));
    if (!deleted) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to delete show");
    }
    await this.redisHelper.hKeyDelete("shows:admin");
    return { message: "Show deleted successfully" };
  }
}
