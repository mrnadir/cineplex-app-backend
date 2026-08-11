import { Router } from "express";
import { SeatTypeController } from "./seat_type.controller";
import { SeatTypeValidator } from "./seat_type.validator";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { defineRoute } from "../../shared/openapi/route-builder";

export class SeatTypeRoutes {
  public router: Router;
  private controller: SeatTypeController;
  private validator: SeatTypeValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new SeatTypeController();
    this.validator = new SeatTypeValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/",
        tags: ["Seat Types"],
        summary: "Create a new seat type",
        description:
          "Allows an authenticated Admin or Super Admin to create a new seat type. CSRF-protected and rate-limited. Request body validated against createSeatTypeZodValidation. Seat type name must be one of: Regular, VIP, Semi Recliner.",
        auth: true,
        schema: this.validator.createSeatTypeZodValidation,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
        ],
        handler: this.controller.create,
      },
      "/seat_type"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/admin",
        tags: ["Seat Types"],
        summary: "Retrieve admin seat type listings",
        description:
          "Fetches seat type data for admin usage with filtering and pagination. Query params are validated against adminQueryZodValidation. Supports filtering by name (Regular, VIP, Semi Recliner) and is_active status.",
        schema: this.validator.adminQueryZodValidation,
        handler: this.controller.adminRetrieve,
      },
      "/seat_type"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["Seat Types"],
        summary: "Delete a seat type",
        description:
          "Soft-deletes a seat type identified by `id` (sets is_active to false). Rate-limited and protected by admin authorization. Path param validated against deleteSeatTypeZodValidation.",
        schema: this.validator.deleteSeatTypeZodValidation,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
        ],
        handler: this.controller.delete,
      },
      "/seat_type"
    );
  }
}

export default new SeatTypeRoutes().router;
