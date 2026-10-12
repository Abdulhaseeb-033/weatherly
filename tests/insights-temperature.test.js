import { describe, it, expect } from "vitest";
import { generateTemperatureInsight } from "../lib/core/insights/rules/temperature.js";

describe("generateTemperatureInsight", () => {
    it("returns null when current weather is missing", () => {
        expect(generateTemperatureInsight(null)).toBeNull();
    });

    it("returns null when feelsLike is invalid", () => {
        expect(generateTemperatureInsight({ feelsLike: null })).toBeNull();
        expect(generateTemperatureInsight({ feelsLike: NaN })).toBeNull();
        expect(generateTemperatureInsight({ feelsLike: "40" })).toBeNull();
    });

    it("generates info for cool conditions", () => {
        const result = generateTemperatureInsight({ feelsLike: 5 });

        expect(result.severity).toBe("info");
        expect(result.type).toBe("temperature");
    });

    it("generates notice for hot conditions", () => {
        const result = generateTemperatureInsight({ feelsLike: 35 });

        expect(result.severity).toBe("notice");
    });

    it("generates caution for extreme heat", () => {
        const result = generateTemperatureInsight({ feelsLike: 40 });

        expect(result.severity).toBe("caution");
    });

    it("generates notice for cold conditions", () => {
        const result = generateTemperatureInsight({ feelsLike: 0 });

        expect(result.severity).toBe("notice");
    });

    it("generates caution for extreme cold", () => {
        const result = generateTemperatureInsight({ feelsLike: -10 });

        expect(result.severity).toBe("caution");
    });

    it("returns null for comfortable conditions", () => {
        expect(generateTemperatureInsight({ feelsLike: 20 })).toBeNull();
    });
});