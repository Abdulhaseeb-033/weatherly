import { describe, it, expect } from "vitest";
import { getUpcomingHours } from "../lib/core/insights/helpers.js";

describe("getUpcomingHours", () => {
    const currentTime = "2026-10-09T14:30";

    const hourly = Array.from({ length: 15 }, (_, index) => {
        const hour = String(index + 8).padStart(2, "0");

        return {
            time: `2026-10-09T${hour}:00`,
            temperature: 25,
        };
    });

    it("should exclude past hours", () => {
        const result = getUpcomingHours(hourly, currentTime);

        expect(result.every((item) => item.time >= "2026-10-09T14")).toBe(true);
    });

    it("should return at most 12 hours", () => {
        const result = getUpcomingHours(hourly, currentTime);

        expect(result).toHaveLength(9);
    });

    it("should return an empty array for invalid input", () => {
        expect(getUpcomingHours(null, currentTime)).toEqual([]);
        expect(getUpcomingHours(hourly, null)).toEqual([]);
    });

    it("should ignore entries without a time", () => {
        const result = getUpcomingHours(
            [{ temperature: 25 }, { time: "2026-10-09T15:00" }],
            currentTime
        );

        expect(result).toHaveLength(1);
    });
});