// show.validation.ts
import z from "zod";
import {
  idParamSchema,
  paginationSchema,
  positiveIntIdSchema,
} from "../../validators";

export class ShowValidator {
  // private/internal reusable body schema
  private static showBody = z.object({
    threater_id: positiveIntIdSchema("Theater ID"),
    movie_id: positiveIntIdSchema("Movie ID"),
    show_date_from: z
      .string({ error: "Show date is required" })
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Show date must be in YYYY-MM-DD format",
      })
      .nullable(),
  });

  // Create Show
  createShowZodValidation = z.object({
    body: ShowValidator.showBody,
  });

  // Update Show
  updateShowZodValidation = z.object({
    params: idParamSchema.optional(),
    body: ShowValidator.showBody.partial().extend({
      is_active: z.boolean().optional(),
    }),
  });

  // Public Query
  publicQueryZodValidation = z.object({
    query: paginationSchema
      .extend({
        theater_id: positiveIntIdSchema("Theater ID").optional(),
        movie_id: positiveIntIdSchema("Movie ID").optional(),
        show_date_from: z.string().trim().optional(),
      })
      .strict(),
  });

  // Admin Query
  adminQueryZodValidation = z.object({
    query: paginationSchema
      .extend({
        theater_id: positiveIntIdSchema("Theater ID").optional(),
        movie_id: positiveIntIdSchema("Movie ID").optional(),
        show_date_from: z.string().trim().optional(),
        sortBy: z
          .enum(["recent", "oldest"], {
            error: "sortBy must be: recent or oldest",
          })
          .optional(),
        status: z.boolean().optional(),
      })
      .strict(),
  });
}
