import { Router } from "express";
import { ShowController } from "./show.controller";
import { ShowValidator } from "./show.validator";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import { AuthMiddleware } from "../../middlewares/authentication-middlware";
import { USER_ROLES } from "../../enums";
import { csrfProtection } from "../../middlewares/csrf-protection.middleware";
import { defineRoute } from "../../shared/openapi/route-builder";

export class ShowRoutes {
  public router: Router;
  private controller: ShowController;
  private validator: ShowValidator;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new ShowController();
    this.validator = new ShowValidator();
    this.authMiddleware = new AuthMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/",
        tags: ["Shows"],
        summary: "Create a new show",
        description:
          "Allows an authenticated Admin or Super Admin to create a new show entry. CSRF-protected and rate-limited. Request body validated against createShowZodValidation.",
        auth: true,
        schema: this.validator.createShowZodValidation,
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
      "/show"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/",
        tags: ["Shows"],
        summary: "Retrieve public show listings",
        description:
          "Publicly accessible endpoint to fetch a list of shows. Supports filtering/pagination via query params validated against publicQueryZodValidation.",
        schema: this.validator.publicQueryZodValidation,
        handler: this.controller.retrieve,
      },
      "/show"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/admin",
        tags: ["Shows"],
        summary: "Retrieve admin show listings",
        description:
          "Fetches show data for admin usage with additional filters. Query params are validated against adminQueryZodValidation.",
        schema: this.validator.adminQueryZodValidation,
        handler: this.controller.adminRetrieve,
      },
      "/show"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id",
        tags: ["Shows"],
        summary: "Update a show",
        description:
          "Updates an existing show identified by `id`. Rate-limited and protected by admin authorization. Request body is validated against updateShowZodValidation.",
        schema: this.validator.updateShowZodValidation,
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
      "/show"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["Shows"],
        summary: "Delete a show",
        description:
          "Permanently deletes a show identified by `id`. Rate-limited and protected by admin authorization.",
        schema: this.validator.updateShowZodValidation,
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
      "/show"
    );
  }
}

export default new ShowRoutes().router;
