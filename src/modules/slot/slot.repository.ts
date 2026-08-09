import pool from "../../db";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";

import { ISlot, ICreateSlot, IUpdateSlot } from "./slot.interface";

export class SlotRepository {
  private pool = pool;

  async create(payload: ICreateSlot): Promise<ISlot | undefined> {
    const result = await this.pool.query<ISlot>(
      `INSERT INTO slots (show_id, slot_time)
      VALUES ($1, $2)
      RETURNING *
      `,
      [payload.show_id, payload.slot_time]
    );

    return result.rows[0];
  }

  async retrieve(
    query: Partial<ISlot>
  ): Promise<{ slots: ISlot[]; pagination: IPagination }> {
    const builder = new QueryBuilder("slots", query)
      .filter(["is_active", "show_id"])
      .select(["id", "show_id", "slot_time"])
      .sort()
      .paginate();

    const slots = await builder.execute<ISlot>();
    const pagination = await builder.getPaginationInfo();

    return { slots, pagination };
  }

  async adminRetrieve(
    query: Partial<ISlot>
  ): Promise<{ slots: ISlot[]; pagination: IPagination }> {
    const builder = new QueryBuilder("slots", query)
      .filter(["is_active", "show_id"])
      .sort()
      .paginate();

    const slots = await builder.execute<ISlot>();
    const pagination = await builder.getPaginationInfo();

    return { slots, pagination };
  }

  // Retrieve a slot item by id
  async findById(id: number): Promise<ISlot | null> {
    const result = await this.pool.query<ISlot>(
      "SELECT * FROM slots WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  // Update a slot item by id (only provided fields change; updated_at via trigger)
  async updateById(id: number, payload: IUpdateSlot): Promise<ISlot | null> {
    const result = await this.pool.query<ISlot>(
      `UPDATE slots SET
      slot_time   = COALESCE($1, slot_time),
      is_active = COALESCE($2, is_active)
      WHERE id = $3
      RETURNING *
      `,
      [payload.slot_time ?? null, payload.is_active ?? null, id]
    );
    return result.rows[0] ?? null;
  }

  async uniqueByTheaterAndMovie(
    show_id: number,
    slot_time: string
  ): Promise<ISlot | null> {
    const result = await this.pool.query<ISlot>(
      "SELECT * FROM slots WHERE show_id = $1 AND slot_time = $2 LIMIT 1",
      [show_id, slot_time]
    );
    return result.rows[0] ?? null;
  }

  // Delete a slot item by id; returns true if a row was removed
  async deleteById(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM slots WHERE id = $1 RETURNING id",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
