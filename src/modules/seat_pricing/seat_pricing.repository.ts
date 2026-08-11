import pool from "../../db";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";
import {
  ISeatPricing,
  ICreateSeatPricing,
  IUpdateSeatPricing,
} from "./seat_pricing.interface";

export class SeatPricingRepository {
  private pool = pool;

  async create(payload: ICreateSeatPricing): Promise<ISeatPricing | undefined> {
    const result = await this.pool.query<ISeatPricing>(
      `INSERT INTO seat_pricings (admin_id, slot_id, seat_type_id, price)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [payload.admin_id, payload.slot_id, payload.seat_type_id, payload.price]
    );

    return result.rows[0];
  }

  async adminRetrieve(
    query: Partial<ISeatPricing>
  ): Promise<{ seatPricings: ISeatPricing[]; pagination: IPagination }> {
    const builder = new QueryBuilder("seat_pricings", query)
      .filter(["is_active", "slot_id", "seat_type_id"])
      .sort()
      .paginate();

    const seatPricings = await builder.execute<ISeatPricing>();
    const pagination = await builder.getPaginationInfo();

    return { seatPricings, pagination };
  }

  async checkUniqueBySlotSeatTypeAndPrice(
    slot_id: number,
    seat_type_id: number,
    price: number,
    excludeId?: number
  ): Promise<ISeatPricing | null> {
    const result = await this.pool.query<ISeatPricing>(
      excludeId
        ? "SELECT * FROM seat_pricings WHERE slot_id = $1 AND seat_type_id = $2 AND price = $3 AND id != $4 LIMIT 1"
        : "SELECT * FROM seat_pricings WHERE slot_id = $1 AND seat_type_id = $2 AND price = $3 LIMIT 1",
      excludeId
        ? [slot_id, seat_type_id, price, excludeId]
        : [slot_id, seat_type_id, price]
    );
    return result.rows[0] ?? null;
  }

  async findById(id: number): Promise<ISeatPricing | null> {
    const result = await this.pool.query<ISeatPricing>(
      "SELECT * FROM seat_pricings WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  async updateById(
    id: number,
    payload: IUpdateSeatPricing
  ): Promise<ISeatPricing | null> {
    const result = await this.pool.query<ISeatPricing>(
      `UPDATE seat_pricings SET
      slot_id      = COALESCE($1, slot_id),
      seat_type_id = COALESCE($2, seat_type_id),
      price        = COALESCE($3, price),
      is_active    = COALESCE($4, is_active)
      WHERE id = $5
      RETURNING *
      `,
      [
        payload.slot_id ?? null,
        payload.seat_type_id ?? null,
        payload.price ?? null,
        payload.is_active ?? null,
        id,
      ]
    );
    return result.rows[0] ?? null;
  }

  async deleteById(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM seat_pricings WHERE id = $1 RETURNING id",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
