import z from "zod";
import { paginationSchema, positiveIntIdSchema } from "../../validators";

export class SeatPricingValidator {
  private static seatPricingBody = z.object({
    slot_id: positiveIntIdSchema("Slot ID"),
    seat_type_id: positiveIntIdSchema("Seat Type ID"),
    price: z.coerce
      .number({ error: "Price is required" })
      .int({ error: "Price must be an integer" })
      .min(0, { error: "Price must be at least 0" }),
  });

  createSeatPricingZodValidation = z.object({
    body: SeatPricingValidator.seatPricingBody,
  });

  updateSeatPricingZodValidation = z.object({
    params: positiveIntIdSchema("Seat Pricing ID"),
    body: z.object({
      slot_id: positiveIntIdSchema("Slot ID").optional(),
      seat_type_id: positiveIntIdSchema("Seat Type ID").optional(),
      price: z.coerce
        .number({ error: "Price must be a number" })
        .int({ error: "Price must be an integer" })
        .min(0, { error: "Price must be at least 0" })
        .optional(),
      is_active: z.boolean().optional(),
    }),
  });

  deleteSeatPricingZodValidation = z.object({
    params: positiveIntIdSchema("Seat Pricing ID"),
  });

  adminQueryZodValidation = z.object({
    query: paginationSchema
      .extend({
        slot_id: positiveIntIdSchema("Slot ID").optional(),
        seat_type_id: positiveIntIdSchema("Seat Type ID").optional(),
        is_active: z.boolean().optional(),
      })
      .strict(),
  });
}
