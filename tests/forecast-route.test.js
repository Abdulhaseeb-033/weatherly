import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../lib/server/errors/AppError";

const { fetchForecast, checkRateLimit, getCachedWeather, setCachedWeather, } = vi.hoisted(() => ({
    fetchForecast: vi.fn(),
    checkRateLimit: vi.fn(),
    getCachedWeather: vi.fn(),
    setCachedWeather: vi.fn(),
}));

vi.mock("@/lib/server/providers/openMeteo/client", () => ({
    fetchForecast,
}));

vi.mock("@/lib/server/rateLimit/rateLimiter", () => ({
    checkRateLimit,
}));

vi.mock("@/lib/server/rateLimit/getClientIp", () => ({
    getClientIp: vi.fn(() => "test-ip"),
}));

vi.mock("@/lib/server/cache/weatherCache", () => ({
    getCachedWeather,
    setCachedWeather,
}));

import { GET } from "@/app/api/v1/forecast/route";

describe("GET /api/v1/forecast", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        fetchForecast.mockReset();
        checkRateLimit.mockReset();
        getCachedWeather.mockReset();
        setCachedWeather.mockReset();

        checkRateLimit.mockResolvedValue({
            allowed: true,
            limit: 30,
            remaining: 29,
            retryAfter: 60,
        });

        getCachedWeather.mockResolvedValue(null);
        setCachedWeather.mockResolvedValue(undefined);
    });

    it("returns 400 when latitude is missing", async () => {
        const request = new Request(
            "http://localhost:3000/api/v1/forecast?longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.code).toBe("INVALID_INPUT");
        expect(fetchForecast).not.toHaveBeenCalled();
    });

    it("returns 400 when longitude is missing", async () => {
        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.code).toBe("INVALID_INPUT");
        expect(fetchForecast).not.toHaveBeenCalled();
    });

    it("returns 400 for invalid coordinates", async () => {
        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=91&longitude=181"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error.code).toBe("INVALID_INPUT");
        expect(fetchForecast).not.toHaveBeenCalled();
    });

    it("returns 503 when the weather service fails", async () => {
        fetchForecast.mockRejectedValue(
            new AppError(
                "Unable to reach Open-Meteo.",
                "UPSTREAM_UNAVAILABLE",
                503
            )
        );

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error.code).toBe("UPSTREAM_UNAVAILABLE");
    });

    it("returns 504 when the weather service times out", async () => {
        fetchForecast.mockRejectedValue(
            new AppError(
                "Open-Meteo request timed out.",
                "UPSTREAM_TIMEOUT",
                504
            )
        );

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(504);
        expect(data.error.code).toBe("UPSTREAM_TIMEOUT");
    });

    it("returns 500 when an unexpected error occurs", async () => {
        fetchForecast.mockRejectedValue(
            new Error("Unexpected database failure")
        );

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error.code).toBe("INTERNAL_ERROR");
    });

    it("returns weather data for valid coordinates", async () => {
        fetchForecast.mockResolvedValue({
            timezone: "Asia/Karachi",
            current: {
                temperature_2m: 29.3,
                apparent_temperature: 32.4,
                relative_humidity_2m: 66,
                wind_speed_10m: 14.1,
                weather_code: 0,
                is_day: 1,
            },
            hourly: {
                time: ["2026-10-08T16:00"],
                temperature_2m: [29.3],
                apparent_temperature: [32.4],
                precipitation_probability: [0],
                precipitation: [0],
                weather_code: [0],
                wind_speed_10m: [14.1],
                visibility: [10000],
                uv_index: [2],
                is_day: [1],
            },
            daily: {
                time: ["2026-10-08"],
                temperature_2m_max: [31],
                temperature_2m_min: [25],
                precipitation_probability_max: [10],
                precipitation_sum: [0],
                weather_code: [0],
                uv_index_max: [7],
                wind_gusts_10m_max: [20],
                sunrise: ["2026-10-08T06:20"],
                sunset: ["2026-10-08T18:00"],
            },
        });

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.location.latitude).toBe(24.8608);
        expect(data.location.longitude).toBe(67.0104);
        expect(data.current.temperature).toBe(29.3);
        expect(data.current.condition.label).toBe("Clear sky");

        expect(fetchForecast).toHaveBeenCalledWith(
            24.8608,
            67.0104
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
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
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

        expect(fetchForecast).not.toHaveBeenCalled();
    });

    it("returns 503 when the rate limiter is unavailable", async () => {
        checkRateLimit.mockRejectedValue(
            new Error("Redis unavailable")
        );

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(503);
        expect(data.error.code).toBe("SERVICE_UNAVAILABLE");
        expect(response.headers.get("Retry-After")).toBe("5");

        expect(fetchForecast).not.toHaveBeenCalled();
    });

    it("returns cached weather without calling the provider", async () => {
        const cachedWeather = {
            location: {
                latitude: 24.8608,
                longitude: 67.0104,
            },
            current: {
                temperature: 29.3,
            },
        };

        getCachedWeather.mockResolvedValue(cachedWeather);

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(cachedWeather);
        expect(fetchForecast).not.toHaveBeenCalled();
        expect(setCachedWeather).not.toHaveBeenCalled();
    });

    it("fetches fresh weather when the cache read fails", async () => {
        getCachedWeather.mockRejectedValue(
            new Error("Redis unavailable")
        );

        fetchForecast.mockResolvedValue({
            timezone: "Asia/Karachi",
            current: {
                temperature_2m: 29.3,
                apparent_temperature: 32.4,
                relative_humidity_2m: 66,
                wind_speed_10m: 14.1,
                weather_code: 0,
                is_day: 1,
            },
            hourly: {
                time: ["2026-10-08T16:00"],
                temperature_2m: [29.3],
                apparent_temperature: [32.4],
                precipitation_probability: [0],
                precipitation: [0],
                weather_code: [0],
                wind_speed_10m: [14.1],
                visibility: [10000],
                uv_index: [2],
                is_day: [1],
            },
            daily: {
                time: ["2026-10-08"],
                temperature_2m_max: [31],
                temperature_2m_min: [25],
                precipitation_probability_max: [10],
                precipitation_sum: [0],
                weather_code: [0],
                uv_index_max: [7],
                wind_gusts_10m_max: [20],
                sunrise: ["2026-10-08T06:20"],
                sunset: ["2026-10-08T18:00"],
            },
        });

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.current.temperature).toBe(29.3);
        expect(fetchForecast).toHaveBeenCalledOnce();
    });

    it("returns fresh weather even when cache writing fails", async () => {
        setCachedWeather.mockRejectedValue(
            new Error("Redis write failed")
        );

        fetchForecast.mockResolvedValue({
            timezone: "Asia/Karachi",
            current: {
                temperature_2m: 29.3,
                apparent_temperature: 32.4,
                relative_humidity_2m: 66,
                wind_speed_10m: 14.1,
                weather_code: 0,
                is_day: 1,
            },
            hourly: {
                time: ["2026-10-08T16:00"],
                temperature_2m: [29.3],
                apparent_temperature: [32.4],
                precipitation_probability: [0],
                precipitation: [0],
                weather_code: [0],
                wind_speed_10m: [14.1],
                visibility: [10000],
                uv_index: [2],
                is_day: [1],
            },
            daily: {
                time: ["2026-10-08"],
                temperature_2m_max: [31],
                temperature_2m_min: [25],
                precipitation_probability_max: [10],
                precipitation_sum: [0],
                weather_code: [0],
                uv_index_max: [7],
                wind_gusts_10m_max: [20],
                sunrise: ["2026-10-08T06:20"],
                sunset: ["2026-10-08T18:00"],
            },
        });

        const request = new Request(
            "http://localhost:3000/api/v1/forecast?latitude=24.8608&longitude=67.0104"
        );

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.current.temperature).toBe(29.3);
        expect(setCachedWeather).toHaveBeenCalledOnce();
    });


});