import { AppError } from "../lib/server/errors/AppError";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "../app/api/v1/geocode/route";
import { searchLocations } from "../lib/server/providers/openMeteo/geocoding";
import { checkRateLimit } from "@/lib/server/rateLimit/rateLimiter";

vi.mock("../lib/server/providers/openMeteo/geocoding", () => ({
    searchLocations: vi.fn(),
}));

vi.mock("@/lib/server/rateLimit/rateLimiter", () => ({
    checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/server/rateLimit/getClientIp", () => ({
    getClientIp: vi.fn(() => "test-ip"),
}));

describe("GET /api/v1/geocode", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        checkRateLimit.mockResolvedValue({
            allowed: true,
            limit: 30,
            remaining: 29,
            retryAfter: 60,
        });
    });

    it("returns locations for a valid query", async () => {
        searchLocations.mockResolvedValue([
            {
                id: 1174872,
                name: "Karachi",
                latitude: 24.8608,
                longitude: 67.0104,
                country: "Pakistan",
                country_code: "PK",
                admin1: "Sindh",
                timezone: "Asia/Karachi",
            },
        ]);

        const request = new Request(
            "http://localhost:3000/api/v1/geocode?q=Karachi"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.locations).toHaveLength(1);
        expect(data.locations[0].name).toBe("Karachi");
        expect(searchLocations).toHaveBeenCalledWith("Karachi", "en");
    });

    it("returns 400 for an invalid query", async () => {
        const request = new Request(
            "http://localhost:3000/api/v1/geocode?q=K"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.code).toBe("INVALID_INPUT");

        expect(searchLocations).not.toHaveBeenCalled();
    });

    it("returns 503 when the weather service fails", async () => {
        searchLocations.mockRejectedValue(
            new AppError(
                "Unable to reach Open-Meteo geocoding service.",
                "UPSTREAM_UNAVAILABLE",
                503
            )
        );

        const request = new Request(
            "http://localhost:3000/api/v1/geocode?q=Karachi"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error.code).toBe("UPSTREAM_UNAVAILABLE");
        expect(data.error.message).toBe(
            "Unable to reach Open-Meteo geocoding service."
        );
    });

    it("returns 504 when the weather service times out", async () => {
        searchLocations.mockRejectedValue(
            new AppError(
                "Open-Meteo geocoding request timed out.",
                "UPSTREAM_TIMEOUT",
                504
            )
        );

        const request = new Request(
            "http://localhost:3000/api/v1/geocode?q=Karachi"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(504);
        expect(data.error.code).toBe("UPSTREAM_TIMEOUT");
        expect(data.error.message).toBe(
            "Open-Meteo geocoding request timed out."
        );
    });

    it("returns 429 when the rate limit is exceeded", async () => {
        checkRateLimit.mockResolvedValue({
            allowed: false,
            limit: 30,
            remaining: 0,
            retryAfter: 42,
        });

        const request = new Request(
            "http://localhost:3000/api/v1/geocode?q=Karachi"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(429);

        expect(data.error.code).toBe("RATE_LIMITED");

        expect(data.error.message).toBe(
            "Too many requests. Please try again later."
        );

        expect(data.error.retryAfter).toBe(42);

        expect(response.headers.get("Retry-After")).toBe("42");

        expect(searchLocations).not.toHaveBeenCalled();
    });


});