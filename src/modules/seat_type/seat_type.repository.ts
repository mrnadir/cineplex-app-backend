import pool from "../../db";
import { SEAT_TYPE_STATUS } from "../../enums";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";
import { ISeatType, ICreateSeatType } from "./seat_type.interface";

export class SeatTypeRepository {
  private pool = pool;

  async create(payload: ICreateSeatType): Promise<ISeatType | undefined> {
    const result = await this.pool.query<ISeatType>(
      `INSERT INTO seat_types (admin_id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [payload.admin_id, payload.name, payload.description]
    );

    return result.rows[0];
  }

  async adminRetrieve(
    query: Partial<ISeatType>
  ): Promise<{ seatTypes: ISeatType[]; pagination: IPagination }> {
    const builder = new QueryBuilder("seat_types", query)
      .filter(["is_active"])
      .sort()
      .paginate();

    const seatTypes = await builder.execute<ISeatType>();
    const pagination = await builder.getPaginationInfo();

    return { seatTypes, pagination };
  }

  async checkUniqueByType(type: SEAT_TYPE_STATUS): Promise<ISeatType | null> {
    const result = await this.pool.query<ISeatType>(
      "SELECT * FROM seat_types WHERE type = $1 LIMIT 1",
      [type]
    );
    return result.rows[0] ?? null;
  }

  // Delete a show item by id; returns true if a row was removed
  async deleteById(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM seat_types WHERE id = $1 RETURNING id",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
