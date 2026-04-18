import { formatDate, parseCalendarDate } from "@/utils/dateFormat";

describe("dateFormat", () => {
  test("parseCalendarDate keeps YYYY-MM-DD values on the same local calendar day", () => {
    const date = parseCalendarDate("2026-04-18");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(3);
    expect(date.getDate()).toBe(18);
  });

  test("formatDate uses local calendar parsing for YYYY-MM-DD values", () => {
    const expected = new Date(2026, 3, 18).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    expect(formatDate("2026-04-18")).toBe(expected);
  });
});