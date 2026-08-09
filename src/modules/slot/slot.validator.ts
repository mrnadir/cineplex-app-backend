import z from "zod";
import { paginationSchema, positiveIntIdSchema } from "../../validators";

export class SlotValidator {
  //  slot main fields validation schema.
  private static slotBody = z.object({
    show_id: positiveIntIdSchema("Show ID"),
    slot_time: z
      .string({ error: "Slot time is required" })
      .trim()
      .min(3, { error: "Slot time must be at least 3 characters" })
      .max(6, { error: "Slot time must be at most 6 characters" }),
  });

  // this validator only works for create slot.
  createSlotZodSchema = z.object({
    body: SlotValidator.slotBody,
  });

  // update slot = every create field optional + is_active toggle.
  updateSlotZodSchema = z.object({
    params: positiveIntIdSchema("Slot ID"),
    body: z.object({
      slot_time: z
        .string({ error: "Slot time is required" })
        .trim()
        .min(3, { error: "Slot time must be at least 3 characters" })
        .max(6, { error: "Slot time must be at most 6 characters" })
        .optional(),
      is_active: z
        .enum(["active", "inactive"], {
          error: 'is_active must be either "active" or "inactive"',
        })
        .optional(),
    }),
  });

  // public slots query = pagination only.
  publicSlotsQuerySchema = z.object({
    params: positiveIntIdSchema("Show ID"),
    query: paginationSchema.strict(),
  });

  // admin slots query = pagination only.
  adminSlotsQuerySchema = z.object({
    params: positiveIntIdSchema("Show ID"),
    query: paginationSchema
      .extend({
        is_active: z
          .enum(["active", "inactive"], {
            error: 'is_active must be either "active" or "inactive"',
          })
          .optional(),
      })
      .strict(),
  });

  deleteSlotZodSchema = z.object({
    params: positiveIntIdSchema("Slot ID"),
  });
}
