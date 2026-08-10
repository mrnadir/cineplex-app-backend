import { Router } from "express";
import { TheaterController } from "./theater.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import { TheaterValidator } from "./theater.validation";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { defineRoute } from "../../shared/openapi/route-builder";

export class TheaterRoutes {
  public router: Router;
  private controller: TheaterController;
  private validator: TheaterValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.authMiddleware = new AuthMiddleware();
    this.controller = new TheaterController();
    this.validator = new TheaterValidator();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/",
        tags: ["Theaters"],
        summary: "Create a new theater",
        description:
          "Allows an authenticated Admin or Super Admin to create a new theater entry. CSRF-protected and rate-limited. Request body validated against createTheaterZodSchema.",
        auth: true,
        schema: this.validator.createTheaterZodSchema,
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
      "/theater"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/",
        tags: ["Theaters"],
        summary: "Retrieve public theater listings",
        description:
          "Publicly accessible endpoint (no authentication required) to fetch the list of theaters. Supports filtering/pagination via query params, validated against theatersQuerySchema.",
        schema: this.validator.theatersQuerySchema,
        handler: this.controller.retrieve,
      },
      "/theater"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/admin",
        tags: ["Theaters"],
        summary: "Retrieve all theaters (Admin)",
        description:
          "Fetches all theaters, including inactive/hidden ones, for management purposes. Query params validated against adminTheatersQuerySchema.",
        schema: this.validator.adminTheatersQuerySchema,
        middlewares: [
          writeLimiter,
          this.authMiddleware.authenticate,
          this.authMiddleware.authorize(
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
          ),
          csrfProtection,
        ],
        handler: this.controller.adminRetrieve,
      },
      "/theater"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/:id",
        tags: ["Theaters"],
        summary: "Retrieve a single theater",
        description:
          "Publicly accessible endpoint (no authentication required) to fetch a single theater by its `id`. Params validated against theaterIdParamsSchema.",
        schema: this.validator.theaterIdParamsSchema,
        handler: this.controller.getSingle,
      },
      "/theater"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id",
        tags: ["Theaters"],
        summary: "Update a theater",
        description:
          "Updates an existing theater identified by `id`. Rate-limited. Request body validated against updateTheaterZodSchema.",
        schema: this.validator.updateTheaterZodSchema,
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
      "/theater"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["Theaters"],
        summary: "Delete a theater",
        description:
          "Permanently deletes a theater identified by `id`. Rate-limited. Params validated against theaterIdParamsSchema.",
        schema: this.validator.theaterIdParamsSchema,
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
      "/theater"
    );
  }
}

export default new TheaterRoutes().router;
