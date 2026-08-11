export interface ISeatPricing {
  id: number;
  admin_id: number;
  slot_id: number;
  seat_type_id: number;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ICreateSeatPricing = Omit<
  ISeatPricing,
  "id" | "is_active" | "created_at" | "updated_at"
>;

export type IUpdateSeatPricing = Partial<
  Omit<ISeatPricing, "id" | "admin_id" | "created_at" | "updated_at">
>;
