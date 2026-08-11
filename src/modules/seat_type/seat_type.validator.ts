// show.validation.ts
import z from "zod";
import { paginationSchema, positiveIntIdSchema } from "../../validators";
import { SEAT_TYPE_STATUS } from "../../enums";

export class SeatTypeValidator {
  // private reusable body schema
  private static seatTypeBody = z.object({
    name: z.enum(SEAT_TYPE_STATUS, {
      error: `Seat Type Name must be: ${Object.values(SEAT_TYPE_STATUS).join(", ")}`,
    }),
    description: z.string({ error: "Description is required" }),
  });

  // Create Show
  createSeatTypeZodValidation = z.object({
    body: SeatTypeValidator.seatTypeBody,
  });

  // Create Show
  deleteSeatTypeZodValidation = z.object({
    params: positiveIntIdSchema("Seat Price ID"),
  });

  // Admin Query
  adminQueryZodValidation = z.object({
    query: paginationSchema
      .extend({
        name: z.enum(SEAT_TYPE_STATUS, {
          error: `Seat Type Name must be: ${Object.values(SEAT_TYPE_STATUS).join(", ")}`,
        }),
        is_active: z.boolean().optional(),
      })
      .strict(),
  });
}
