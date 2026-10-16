import { describe, expect, it } from "vitest";
import { messageTime } from "./time";

// Local-time constructors: the formatter works in the viewer's time zone.
const NOW = new Date(2026, 9, 5, 20, 13).getTime(); // Monday 5 Oct 2026, 8:13 PM
const at = (month: number, day: number, h: number, m: number, year = 2026) =>
  new Date(year, month, day, h, m).getTime();

describe("messageTime", () => {
  it("today and yesterday", () => {
    expect(messageTime(at(9, 5, 9, 5), NOW, "en")).toMatch(/^Today 9:05\sAM$/);
    expect(messageTime(at(9, 4, 18, 45), NOW, "en")).toMatch(/^Yesterday 6:45\sPM$/);
  });

  it("weekday name within the last week", () => {
    expect(messageTime(at(9, 2, 12, 33), NOW, "en")).toMatch(/^Friday 12:33\sPM$/);
  });

  it("date with 'at' when older, year only when it differs", () => {
    expect(messageTime(at(8, 19, 1, 21), NOW, "en")).toMatch(/^Sat, Sep 19 at 1:21\sAM$/);
    expect(messageTime(at(8, 19, 1, 21, 2025), NOW, "en")).toContain("2025");
  });

  it("German", () => {
    expect(messageTime(at(9, 5, 9, 5), NOW, "de")).toBe("Heute 09:05");
    expect(messageTime(at(9, 4, 18, 45), NOW, "de")).toBe("Gestern 18:45");
    expect(messageTime(at(9, 2, 12, 33), NOW, "de")).toBe("Freitag 12:33");
    expect(messageTime(at(8, 19, 1, 21), NOW, "de")).toMatch(/ um 01:21$/);
  });

  describe("counts calendar days near midnight", () => {
    it("23:50 viewed at 00:10 the next day is yesterday", () => {
      expect(messageTime(at(9, 4, 23, 50), at(9, 5, 0, 10), "en")).toMatch(
        /^Yesterday 11:50\sPM$/,
      );
    });

    it("22:00 two days ago viewed at 08:00 shows the weekday", () => {
      // Saturday 3 Oct 2026, viewed Monday 5 Oct 2026
      expect(messageTime(at(9, 3, 22, 0), at(9, 5, 8, 0), "en")).toMatch(/^Saturday 10:00\sPM$/);
    });

    it("00:05 viewed at 23:55 the same day is still today", () => {
      expect(messageTime(at(9, 5, 0, 5), at(9, 5, 23, 55), "en")).toMatch(/^Today 12:05\sAM$/);
    });

    it("6 calendar days back shows the weekday, 7 shows the date", () => {
      const now = at(9, 12, 8, 0); // Monday 12 Oct 2026, 8:00 AM
      expect(messageTime(at(9, 6, 22, 0), now, "en")).toMatch(/^Tuesday 10:00\sPM$/);
      expect(messageTime(at(9, 5, 22, 0), now, "en")).toMatch(/^Mon, Oct 5 at 10:00\sPM$/);
    });

    it("German", () => {
      expect(messageTime(at(9, 4, 23, 50), at(9, 5, 0, 10), "de")).toBe("Gestern 23:50");
    });
  });
});
