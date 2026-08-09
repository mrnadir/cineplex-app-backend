export interface IShow {
  id: number;
  admin_id: number;
  theater_id: number;
  movie_id: number;
  show_date: string | null; // "YYYY-MM-DD" it's mean ISO format date string, e.g. "2023-01-01"
  status: "active" | "deleted";
  created_at: string;
  updated_at: string;
}

// this type will be used when creating a new show, so we omit the fields that are not required for creation
export type ICreateShow = Omit<
  IShow,
  "id" | "status" | "created_at" | "updated_at"
>;

// this type will be used when updating an existing show, so we make all fields optional and allow updating the is_active field
export interface IUpdateShow {
  theater_id: number;
  movie_id: number;
  show_date: string | null; // "YYYY-MM-DD" it's mean ISO format date string, e.g. "2023-01-01"
  status: "active" | "deleted";
}
