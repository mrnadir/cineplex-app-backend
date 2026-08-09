import { StatusCodes } from "http-status-codes";
import { SlotRepository } from "./slot.repository";
import { ICreateSlot, ISlot, IUpdateSlot } from "./slot.interface";
import { RedisHelper } from "../../shared/redis/redis.helper";
import ApiError from "../../errors/ApiErrors";
import parseId from "../../shared/parseId";
import { IPagination } from "../../types/pagination";

export class SlotService {
  private slotRepository = new SlotRepository();
  private redisHelper = new RedisHelper();

  constructor() {}

  // Create a new slot in the database, ensuring uniqueness by theater and movie combination
  async createSlotToDB(payload: ICreateSlot): Promise<ISlot | undefined> {
    const existing = await this.slotRepository.uniqueByTheaterAndMovie(
      payload.show_id,
      payload.slot_time as string
    );
    if (existing) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        "A slot with this show id already exists"
      );
    }
    const slot = await this.slotRepository.create(payload);
    return slot;
  }

  // Retrieve slots from the database with caching support
  async retrievePublicSlotsFromDB(query: Partial<ISlot>) {
    const cached = await this.redisHelper.hget<{
      slots: ISlot[];
      pagination: IPagination;
    }>("slots:public", query);

    if (cached) {
      return cached;
    }
    const result = await this.slotRepository.retrieve(query);
    const ttl = result.slots.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("slots:public", query, result, ttl);
    return result;
  }

  // Admin retrieve slots from the database with caching support
  async adminRetrieveSlotsFromDB(query: Partial<ISlot>) {
    const cached = await this.redisHelper.hget<{
      slots: ISlot[];
      pagination: IPagination;
    }>("slots:admin", query);
    if (cached) {
      return cached;
    }
    const result = await this.slotRepository.retrieve(query);
    const ttl = result.slots.length > 0 ? 3600 : 60;
    await this.redisHelper.hset("slots:admin", query, result, ttl);
    return result;
  }

  // update a slot in the database by id
  async updateSlotInDB(id: string, data: IUpdateSlot) {
    const findingSlot = await this.slotRepository.findById(Number(id));
    if (!findingSlot) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Slot not found");
    }
    const updatedSlot = await this.slotRepository.updateById(Number(id), data);
    if (!updatedSlot) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update slot");
    }
    await this.redisHelper.hKeyDelete("slots:admin");
    await this.redisHelper.hKeyDelete("slots:public");
    return updatedSlot;
  }

  // delete a slot from the database by id
  async deleteSlotFromDB(id: string) {
    const slotId = parseId(id, "Slot id");
    const findingSlot = await this.slotRepository.findById(slotId);
    if (!findingSlot) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Slot not found");
    }
    const deleted = await this.slotRepository.deleteById(slotId);
    if (!deleted) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to delete slot");
    }
    await this.redisHelper.hKeyDelete("slots:admin");
    await this.redisHelper.hKeyDelete("slots:public");
    return { message: "Slot deleted successfully" };
  }
}
