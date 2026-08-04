import fs from "fs";
import path from "path";
import handlebars from "handlebars";
import QRCode from "qrcode";

/** A single seat layout row as defined in the cinema's static seat map. */
interface LayoutRow {
  row: string;
  groups: number[][];
}

/** A single seat's render-ready state (already resolved to CSS values). */
interface SeatCell {
  bg: string;
  visibility: "visible" | "hidden";
}

/** A full row of seats, ready to be looped over in the Handlebars template. */
interface SeatRow {
  row: string;
  seats: SeatCell[];
}

/** Options accepted by createTicketHTML(). All fields are optional and fall back to defaults. */
export interface TicketOptions {
  bookingId?: string;
  bookedSeats?: string[];
  movieTitle?: string;
  classType?: string;
  language?: string;
  format?: string;
  posterUrl?: string;
  showDate?: string;
  showTime?: string;
  duration?: string;
  cinemaName?: string;
  cinemaAddress?: string;
}

/** The fully-resolved data object handed to the Handlebars template. */
interface TicketTemplateData {
  bookingId: string;
  qrDataURL: string;
  seatRows: SeatRow[];
  seatsLabel: string;
  movieTitle: string;
  classType: string;
  language: string;
  format: string;
  posterUrl: string;
  showDate: string;
  showTime: string;
  duration: string;
  cinemaName: string;
  cinemaAddress: string;
}

const LAYOUT: LayoutRow[] = [
  {
    row: "J",
    groups: [
      [1, 2, 3, 4, 5, 6],
      [0, 0, 0, 0, 0, 0],
      [7, 8, 9, 10, 11, 12],
    ],
  },
  {
    row: "H",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5],
      [0, 0, 0, 0, 0],
      [6, 7],
      [0, 0],
      [9, 10],
    ],
  },
  {
    row: "G",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [0, 0],
      [13, 14],
    ],
  },
  {
    row: "F",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [0, 0],
      [13, 14],
    ],
  },
  {
    row: "E",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [0, 0],
      [13, 14],
    ],
  },
  {
    row: "D",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [0, 0],
      [13, 14],
    ],
  },
  {
    row: "C",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [0, 0],
      [13, 14],
    ],
  },
  {
    row: "B",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [0, 0],
      [13, 14],
    ],
  },
  {
    row: "A",
    groups: [
      [1, 2],
      [0, 0],
      [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      [0, 0],
      [13, 14],
    ],
  },
];

function buildSeatRows(bookedSeats: string[]): SeatRow[] {
  const bookedSet = new Set<string>(bookedSeats);

  return LAYOUT.map(({ row, groups }): SeatRow => {
    const seats: SeatCell[] = groups.flatMap((nums: number[]): SeatCell[] =>
      nums.map((n: number): SeatCell => {
        const id = `${row}${n}`;
        const isHidden = n === 0;
        const isBooked = bookedSet.has(id);

        return {
          bg: isBooked ? "#16a34a" : "#d1d5db",
          visibility: isHidden ? "hidden" : "visible",
        };
      })
    );

    return { row, seats };
  });
}

export async function createTicketHTML(
  options: TicketOptions = {}
): Promise<string> {
  const {
    bookingId = "BK-2026-000123",
    bookedSeats = ["E6", "E7", "E8", "E9"],
    movieTitle = "Asterix: The Land of the Gods",
    classType = "Gold Class",
    language = "ENGLISH",
    format = "3D",
    posterUrl = "https://res.cloudinary.com/ddqovbzxy/image/upload/v1775355667/177400593321790_m9a1b6.jpg",
    showDate = "16 FEB",
    showTime = "9:30 PM",
    duration = "2h 20 min",
    cinemaName = "START CINEPLEX",
    cinemaAddress = "SK TOWER, MOHAKHALI",
  } = options;

  // 1. QR code
  const qrValue = `https://yourdomain.com/booking/${bookingId}`;
  const qrDataURL: string = await QRCode.toDataURL(qrValue, {
    width: 200,
    margin: 1,
    errorCorrectionLevel: "H",
  });

  // 2. Seat grid data (pure JS/TS logic lives here, not in the template)
  const seatRows: SeatRow[] = buildSeatRows(bookedSeats);
  const seatsLabel: string = bookedSeats.join(", ");

  // 3. Load & compile the .hbs template
  const templatePath = path.resolve(
    __dirname,
    "..",
    "..",
    "src",
    "eTicket",
    "eTicket.hbs"
  );
  const templateSource: string = fs.readFileSync(templatePath, "utf8");
  const template = handlebars.compile<TicketTemplateData>(templateSource);

  // 4. Render final HTML
  const templateData: TicketTemplateData = {
    bookingId,
    qrDataURL,
    seatRows,
    seatsLabel,
    movieTitle,
    classType,
    language,
    format,
    posterUrl,
    showDate,
    showTime,
    duration,
    cinemaName,
    cinemaAddress,
  };

  return template(templateData);
}
