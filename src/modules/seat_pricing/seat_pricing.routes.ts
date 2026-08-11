import { Router } from "express";
import { SeatPricingController } from "./seat_pricing.controller";
import { SeatPricingValidator } from "./seat_pricing.validator";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { defineRoute } from "../../shared/openapi/route-builder";

export class SeatPricingRoutes {
  public router: Router;
  private controller: SeatPricingController;
  private validator: SeatPricingValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new SeatPricingController();
    this.validator = new SeatPricingValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/",
        tags: ["Seat Pricings"],
        summary: "Create a new seat pricing",
        description:
          "Allows an authenticated Admin or Super Admin to create a new seat pricing. CSRF-protected and rate-limited. Request body validated against createSeatPricingZodValidation. Each slot, seat type, and price combination must be unique.",
        auth: true,
        schema: this.validator.createSeatPricingZodValidation,
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
      "/seat_pricing"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/admin",
        tags: ["Seat Pricings"],
        summary: "Retrieve admin seat pricing listings",
        description:
          "Fetches seat pricing data for admin usage with filtering and pagination. Query params are validated against adminQueryZodValidation. Supports filtering by slot_id, seat_type_id, and is_active status.",
        schema: this.validator.adminQueryZodValidation,
        handler: this.controller.adminRetrieve,
      },
      "/seat_pricing"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id",
        tags: ["Seat Pricings"],
        summary: "Update a seat pricing",
        description:
          "Updates an existing seat pricing identified by `id`. Rate-limited and protected by admin authorization. Request body is validated against updateSeatPricingZodValidation.",
        schema: this.validator.updateSeatPricingZodValidation,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
        ],
        handler: this.controller.update,
      },
      "/seat_pricing"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["Seat Pricings"],
        summary: "Delete a seat pricing",
        description:
          "Deletes a seat pricing identified by `id`. Rate-limited and protected by admin authorization. Path param validated against deleteSeatPricingZodValidation.",
        schema: this.validator.deleteSeatPricingZodValidation,
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
      "/seat_pricing"
    );
  }
}

export default new SeatPricingRoutes().router;
