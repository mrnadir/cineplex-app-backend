export interface ISlot {
  id: number;
  admin_id: number; // FK → Admin
  show_id: number; // FK → Show
  slot_time: string | null; // "HH:MM"
  is_active: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export type ICreateSlot = Omit<
  ISlot,
  "id" | "is_active" | "created_at" | "updated_at"
>;

export type IUpdateSlot = Partial<
  Omit<ISlot, "id" | "admin_id" | "created_at" | "updated_at" | "show_id">
>;
