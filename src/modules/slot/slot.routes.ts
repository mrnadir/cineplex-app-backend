import { Router } from "express";
import { SlotValidator } from "./slot.validator";
import { SlotController } from "./slot.controller";
import { writeLimiter } from "../../middlewares/rate-limiter.middleware";
import { defineRoute } from "../../shared/openapi/route-builder";

export class SlotRoutes {
  public router: Router;
  private controller: SlotController;
  private validator: SlotValidator;

  constructor() {
    this.router = Router();
    this.controller = new SlotController();
    this.validator = new SlotValidator();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    defineRoute(
      this.router,
      {
        method: "post",
        path: "/",
        tags: ["Slots"],
        summary: "Create a new slot",
        description:
          "Creates a new slot for a show. Request body is validated against createSlotZodSchema and rate-limited.",
        schema: this.validator.createSlotZodSchema,
        middlewares: [writeLimiter],
        handler: this.controller.create,
      },
      "/slot"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/admin/:id",
        tags: ["Slots"],
        summary: "Retrieve admin slots for a show",
        description:
          "Fetches slot records for a specific show with admin-level filtering and pagination. Query params are validated against adminSlotsQuerySchema.",
        schema: this.validator.adminSlotsQuerySchema,
        handler: this.controller.adminRetrieve,
      },
      "/slot"
    );

    defineRoute(
      this.router,
      {
        method: "get",
        path: "/:id",
        tags: ["Slots"],
        summary: "Retrieve public slots for a show",
        description:
          "Fetches public slot entries for a show by show id. Query params are validated against publicSlotsQuerySchema.",
        schema: this.validator.publicSlotsQuerySchema,
        handler: this.controller.retrieve,
      },
      "/slot"
    );

    defineRoute(
      this.router,
      {
        method: "patch",
        path: "/:id",
        tags: ["Slots"],
        summary: "Update an existing slot",
        description:
          "Updates a slot by id. The request body is partially validated and rate-limited.",
        schema: this.validator.updateSlotZodSchema,
        middlewares: [writeLimiter],
        handler: this.controller.update,
      },
      "/slot"
    );

    defineRoute(
      this.router,
      {
        method: "delete",
        path: "/:id",
        tags: ["Slots"],
        summary: "Delete a slot",
        description:
          "Deletes a slot by id. The route parameter is validated against the slot id schema, and the action is rate-limited.",
        schema: this.validator.deleteSlotZodSchema,
        middlewares: [writeLimiter],
        handler: this.controller.delete,
      },
      "/slot"
    );
  }
}

export default new SlotRoutes().router;
