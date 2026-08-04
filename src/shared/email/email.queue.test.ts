import { buildTicketEmailJob } from "./email.queue";

describe("buildTicketEmailJob", () => {
  it("builds a queued email payload with a PDF attachment", () => {
    const pdfBuffer = Buffer.from("pdf-content");

    const job = buildTicketEmailJob({
      to: "user@example.com",
      pdfBuffer,
      fileName: "ticket-123.pdf",
      context: { bookingId: "BK-123" },
    });

    expect(job.to).toBe("user@example.com");
    expect(job.template).toBe("eTicket");
    expect(job.subject).toBe("Your Cineplex eTicket");
    expect(job.attachments).toHaveLength(1);
    expect(job.attachments?.[0]).toMatchObject({
      filename: "ticket-123.pdf",
      contentType: "application/pdf",
      encoding: "base64",
    });
    expect(job?.attachments?.[0]?.content).toBe(pdfBuffer.toString("base64"));
    expect(job.context).toMatchObject({
      bookingId: "BK-123",
      ticketFileName: "ticket-123.pdf",
    });
  });
});
