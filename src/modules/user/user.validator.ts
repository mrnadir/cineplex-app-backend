import { z } from "zod";
import { USER_ROLES } from "../../enums";
import {
  emailSchema,
  passwordZodValidator,
  phoneSchema,
  positiveIntIdSchema,
} from "../../validators";

export class UserValidator {
  private static userBody = z.object({
    name: z
      .string()
      .trim()
      .min(2, { error: "Name must be at least 2 characters" })
      .max(100, { error: "Name must be at most 100 characters" }),
    phone: phoneSchema,
    email: emailSchema,
  });

  createUserZodSchema = z.object({
    body: UserValidator.userBody
      .extend({
        role: z
          .enum(USER_ROLES, {
            error: "role must be USER, ADMIN or SUPER_ADMIN",
          })
          .optional(),
        password: z
          .string()
          .trim()
          .min(6, { error: "Password must be at least 6 characters" })
          .max(12, { error: "Password must be at most 12 characters" }),
      })
      .strict(),
  });

  updateUserZodSchema = z.object({
    params: positiveIntIdSchema("User ID"),
    body: UserValidator.userBody
      .partial()
      .extend({
        avatar: z
          .string()
          .trim()
          .url("avatar must be a valid URL")
          .max(2048, { error: "Avatar must be at most 2048 characters" })
          .optional(),
      })
      .strict(),
  });

  retrievedProfileZodSchema = z.object({
    params: positiveIntIdSchema("User ID"),
  });

  changePasswordZodSchema = z.object({
    body: z.object({
      current_password: z
        .string({ error: "Current password is required" })
        .min(1),
      new_password: passwordZodValidator,
      confirm_password: passwordZodValidator,
    }),
  });
}
