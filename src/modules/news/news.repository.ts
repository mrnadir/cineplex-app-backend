import pool from "../../db";
import QueryBuilder from "../../shared/QueryBuilder";
import { IPagination } from "../../types/pagination";
import { ICreateNews, INews, INewsUpdate } from "./news.interface";

export class NewsRepository {
  private pool = pool;

  async create(payload: ICreateNews): Promise<INews | undefined> {
    const result = await this.pool.query<INews>(
      `INSERT INTO news (title, news_image, content, user_id)
             VALUES ($1, $2, $3, $4)
             RETURNING *
            `,
      [payload.title, payload.news_image, payload.content, payload.user_id]
    );

    return result.rows[0];
  }

  async retrieve(
    query: Partial<INews>
  ): Promise<{ news: INews[]; pagination: IPagination }> {
    const builder = new QueryBuilder("news", query)
      .search(["title", "content"])
      .filter(["status"])
      .sort()
      .paginate();

    const news = await builder.execute<INews>();
    const pagination = await builder.getPaginationInfo();

    return { news, pagination };
  }

  // Retrieve a news item by id
  async findById(id: number): Promise<INews | null> {
    const result = await this.pool.query<INews>(
      "SELECT * FROM news WHERE id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] ?? null;
  }

  // Update a news item by id (only provided fields change; updated_at via trigger)
  async updateById(id: number, payload: INewsUpdate): Promise<INews | null> {
    const result = await this.pool.query<INews>(
      `UPDATE news SET
      title      = COALESCE($1, title),
      news_image = COALESCE($2, news_image),
      content    = COALESCE($3, content),
      status     = COALESCE($4, status)
      WHERE id = $5
      RETURNING *
      `,
      [
        payload.title ?? null,
        payload.news_image ?? null,
        payload.content ?? null,
        payload.status ?? null,
        id,
      ]
    );
    return result.rows[0] ?? null;
  }

  // Delete a news item by id; returns true if a row was removed
  async deleteById(id: number): Promise<boolean> {
    const result = await this.pool.query(
      "DELETE FROM news WHERE id = $1 RETURNING id",
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
