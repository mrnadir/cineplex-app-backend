import { SEAT_TYPE_STATUS } from "../../enums";

export interface ISeatType {
  id: number;
  admin_id: number;
  name: SEAT_TYPE_STATUS;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ICreateSeatType = Omit<
  ISeatType,
  "id" | "is_active" | "created_at" | "updated_at"
>;
