import { CorsOptions } from "cors";
import config from ".";

const allowedOrigins =
  config.node_env === "production"
    ? config.cors.prod_origins?.split(",") || []
    : config.cors.allowed_origins?.split(",") || [];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
};
