import { describe, it, expect } from "vitest";
import { generateRainInsight } from "../lib/core/insights/rules/rain.js";

describe("generateRainInsight", () => {
    it("returns null when forecast is empty", () => {
        expect(generateRainInsight([])).toBeNull();
    });

    it("returns null for invalid input", () => {
        expect(generateRainInsight(null)).toBeNull();
    });

    it("generates an info insight when rain is possible", () => {
        const result = generateRainInsight([
            {
                time: "2026-10-12T14:00",
                rainProbability: 45,
                precipitation: 1,
            },
        ]);

        expect(result.severity).toBe("info");
        expect(result.type).toBe("rain");
        expect(result.window.start).toBe("2026-10-12T14:00");
    });

    it("generates a notice when rain probability is high", () => {
        const result = generateRainInsight([
            {
                time: "2026-10-12T15:00",
                rainProbability: 70,
                precipitation: 2,
            },
        ]);

        expect(result.severity).toBe("notice");
    });

    it("generates a caution for heavy precipitation", () => {
        const result = generateRainInsight([
            {
                time: "2026-10-12T16:00",
                rainProbability: 45,
                precipitation: 8,
            },
        ]);

        expect(result.severity).toBe("caution");
    });

    it("ignores hours with missing rain data", () => {
        const result = generateRainInsight([
            {
                time: "2026-10-12T14:00",
                rainProbability: null,
                precipitation: 5,
            },
        ]);

        expect(result).toBeNull();
    });

    it("ignores precipitation below the minimum threshold", () => {
        const result = generateRainInsight([
            {
                time: "2026-10-12T14:00",
                rainProbability: 90,
                precipitation: 0,
            },
        ]);

        expect(result).toBeNull();
    });
});