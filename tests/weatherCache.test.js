import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getCachedWeather,
    setCachedWeather,
} from "@/lib/server/cache/weatherCache";
import { getRedisClient } from "@/lib/server/redis/client";

vi.mock("@/lib/server/redis/client", () => ({
    getRedisClient: vi.fn(),
}));

describe("weatherCache", () => {
    let redis;

    beforeEach(() => {
        vi.clearAllMocks();

        redis = {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
        };

        getRedisClient.mockResolvedValue(redis);
    });

    describe("getCachedWeather", () => {
        it("returns null when the cache is empty", async () => {
            redis.get.mockResolvedValue(null);

            const result = await getCachedWeather(24.8608, 67.0104);

            expect(result).toBeNull();
            expect(redis.get).toHaveBeenCalledWith(
                "weather:forecast:24.8608:67.0104"
            );
        });

        it("returns parsed weather data from the cache", async () => {
            const weather = {
                location: {},
                current: { temperature: 29.3 },
                hourly: {},
                daily: {},
            };

            redis.get.mockResolvedValue(JSON.stringify(weather));

            const result = await getCachedWeather(24.8608, 67.0104);

            expect(result).toEqual(weather);
        });

        it("deletes invalid JSON and returns null", async () => {
            redis.get.mockResolvedValue("{invalid json");
            redis.del.mockResolvedValue(1);

            const result = await getCachedWeather(24.8608, 67.0104);

            expect(result).toBeNull();
            expect(redis.del).toHaveBeenCalledWith(
                "weather:forecast:24.8608:67.0104"
            );
        });

        it("deletes cached JSON with an invalid weather structure", async () => {
            redis.get.mockResolvedValue(
                JSON.stringify({
                    location: {},
                    current: {},
                })
            );

            redis.del.mockResolvedValue(1);

            const result = await getCachedWeather(24.8608, 67.0104);

            expect(result).toBeNull();
            expect(redis.del).toHaveBeenCalledWith(
                "weather:forecast:24.8608:67.0104"
            );
        });

        it("propagates Redis read errors", async () => {
            redis.get.mockRejectedValue(new Error("Redis unavailable"));

            await expect(
                getCachedWeather(24.8608, 67.0104)
            ).rejects.toThrow("Redis unavailable");
        });

        it("propagates errors if invalid cache data cannot be deleted", async () => {
            redis.get.mockResolvedValue("{invalid json");
            redis.del.mockRejectedValue(new Error("Redis delete failed"));

            await expect(
                getCachedWeather(24.8608, 67.0104)
            ).rejects.toThrow("Redis delete failed");
        });
    });

    describe("setCachedWeather", () => {
        it("stores weather data with a 600-second TTL", async () => {
            const weather = {
                location: {},
                current: { temperature: 29.3 },
                hourly: {},
                daily: {},
            };

            redis.set.mockResolvedValue("OK");

            await setCachedWeather(24.8608, 67.0104, weather);

            expect(redis.set).toHaveBeenCalledWith(
                "weather:forecast:24.8608:67.0104",
                JSON.stringify(weather),
                { EX: 600 }
            );
        });

        it("propagates Redis write errors", async () => {
            redis.set.mockRejectedValue(new Error("Redis write failed"));

            await expect(
                setCachedWeather(24.8608, 67.0104, {
                    current: { temperature: 29.3 },
                })
            ).rejects.toThrow("Redis write failed");
        });
    });
});