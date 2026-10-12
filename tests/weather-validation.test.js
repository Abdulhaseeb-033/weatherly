import { describe, expect, it } from "vitest";
import { forecastQuerySchema } from "@/lib/server/validation/weather.js";

describe("forecastQuerySchema", () => {
    it("accepts valid coordinates", () => {
        const result = forecastQuerySchema.safeParse({
            latitude: "24.8608",
            longitude: "67.0104",
        });

        expect(result.success).toBe(true);

        expect(result.data).toEqual({
            latitude: 24.8608,
            longitude: 67.0104,
        });
    });

    it("rejects invalid latitude", () => {
        const result = forecastQuerySchema.safeParse({
            latitude: "91",
            longitude: "67.0104",
        });

        expect(result.success).toBe(false);
    });

    it("rejects invalid longitude", () => {
        const result = forecastQuerySchema.safeParse({
            latitude: "24.8608",
            longitude: "181",
        });

        expect(result.success).toBe(false);
    });

    it("rejects non-numeric coordinates", () => {
        const result = forecastQuerySchema.safeParse({
            latitude: "abc",
            longitude: "67.0104",
        });

        expect(result.success).toBe(false);
    });

    it("rejects missing coordinates", () => {
        const result = forecastQuerySchema.safeParse({});

        expect(result.success).toBe(false);
    });
});