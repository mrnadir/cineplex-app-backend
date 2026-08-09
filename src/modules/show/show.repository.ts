import pool from "../../db";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";
import { IShow, ICreateShow, IUpdateShow } from "./show.interface";

export class ShowRepository {
  private pool = pool;

  async create(payload: ICreateShow): Promise<IShow | undefined> {
    const result = await this.pool.query<IShow>(
      `INSERT INTO shows (theater_id, movie_id, show_date, admin_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        payload.theater_id,
        payload.movie_id,
        payload.show_date,
        payload.admin_id,
      ]
    );

    return result.rows[0];
  }

  async retrieve(
    query: Partial<IShow>
  ): Promise<{ shows: IShow[]; pagination: IPagination }> {
    const builder = new QueryBuilder("shows", query)
      .filter(["is_active", "theater_id", "movie_id", "show_date_from"])
      .sort()
      .paginate();

    const shows = await builder.execute<IShow>();
    const pagination = await builder.getPaginationInfo();

    return { shows, pagination };
  }

  // Retrieve a show item by id
  async findById(id: number): Promise<IShow | null> {
    const result = await this.pool.query<IShow>(
      "SELECT * FROM shows WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  // Update a show item by id (only provided fields change; updated_at via trigger)
  async updateById(id: number, payload: IUpdateShow): Promise<IShow | null> {
    const result = await this.pool.query<IShow>(
      `UPDATE shows SET
      theater_id = COALESCE($1, theater_id),
      movie_id   = COALESCE($2, movie_id),
      show_date = COALESCE($3, show_date),
      status = COALESCE($4, status)
      WHERE id = $4
      RETURNING *
      `,
      [
        payload.theater_id ?? null,
        payload.movie_id ?? null,
        payload.show_date ?? null,
        payload.status ?? null,
        id,
      ]
    );
    return result.rows[0] ?? null;
  }

  async uniqueByTheaterAndMovie(
    theater_id: number,
    movie_id: number
  ): Promise<IShow | null> {
    const result = await this.pool.query<IShow>(
      "SELECT * FROM shows WHERE theater_id = $1 AND movie_id = $2 LIMIT 1",
      [theater_id, movie_id]
    );
    return result.rows[0] ?? null;
  }

  // Delete a show item by id; returns true if a row was removed
  async deleteById(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM shows WHERE id = $1 RETURNING id",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
