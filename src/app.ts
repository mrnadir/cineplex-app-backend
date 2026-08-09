import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import requestLogger from "./middlewares/request-logger.middleware";
import { welcome } from "./utils/welcome";
import { helmetOptions } from "./config/helmet";
import { corsOptions } from "./config/cors";
import { globalLimiter } from "./config/globalLimiter";
import router from "./routes";
import * as queues from "./shared/queue/manifest";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import ErrorHandler from "./middlewares/error-handler.middleware";
import { generateOpenApiSpec } from "./config/swagger";
import swaggerUi from "swagger-ui-express";

dotenv.config();

const app = express();

// project tech history forensics:
app.disable("x-powered-by");

// getting the real client IP behind a proxy (like Nginx or Cloudflare);
app.set("trust proxy", 1);

// Use strong ETag headers for caching, which helps with client-side caching and reduces bandwidth usage.
app.set("etag", "strong");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(requestLogger);
app.use(cookieParser());

//file retrieve
app.use(express.static("uploads"));
app.use("/api/v1", router);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(generateOpenApiSpec(), {
    swaggerOptions: { docExpansion: "none" },
  })
);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: Object.values(queues).map((q) => new BullMQAdapter(q)),
  serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());

app.get("/", (_req: Request, res: Response) => {
  res.send(welcome());
});

app.use(ErrorHandler);

export default app;
