import request from "supertest";
import app from "../../app";
import { emailWorker } from "../../shared/email/email.worker";
import { transporter } from "../../shared/email/mailer";

afterAll(async () => {
  await emailWorker.close();
  transporter.close();
});

describe("Banner API Integration", () => {
  describe("GET /api/v1/banner/public-banner", () => {
    it("should return list of banners with status 200", async () => {
      const response = await request(app).get("/api/v1/banner/public-banner");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
