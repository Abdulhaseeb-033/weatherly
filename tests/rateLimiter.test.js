
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/server/rateLimit/rateLimiter";
import { getRedisClient } from "@/lib/server/redis/client";

vi.mock("@/lib/server/redis/client", () => ({
    getRedisClient: vi.fn(),
}));

describe("checkRateLimit", () => {
    let redis;

    beforeEach(() => {
        redis = {
            eval: vi.fn(),
        };

        getRedisClient.mockResolvedValue(redis);
    });

    it("allows requests within the limit", async () => {
        redis.eval.mockResolvedValue([2, 58]);

        const result = await checkRateLimit("test-key", 3, 60);

        expect(result).toEqual({
            allowed: true,
            limit: 3,
            remaining: 1,
            retryAfter: 58,
        });
    });

    it("blocks requests above the limit", async () => {
        redis.eval.mockResolvedValue([4, 50]);

        const result = await checkRateLimit("test-key", 3, 60);

        expect(result).toEqual({
            allowed: false,
            limit: 3,
            remaining: 0,
            retryAfter: 50,
        });
    });

    it("executes the atomic Redis script with the correct arguments", async () => {
        redis.eval.mockResolvedValue([1, 60]);

        await checkRateLimit("test-key", 3, 60);

        expect(redis.eval).toHaveBeenCalledWith(
            expect.any(String),
            {
                keys: ["test-key"],
                arguments: ["60"],
            }
        );
    });

    it("rejects invalid rate-limit configuration", async () => {
        await expect(
            checkRateLimit("test-key", 0, 60)
        ).rejects.toThrow("Invalid rate-limit configuration.");

        await expect(
            checkRateLimit("test-key", 3, 0)
        ).rejects.toThrow("Invalid rate-limit configuration.");

        expect(getRedisClient).not.toHaveBeenCalled();
    });

    it("propagates Redis errors instead of silently allowing requests", async () => {
        redis.eval.mockRejectedValue(new Error("Redis unavailable"));

        await expect(
            checkRateLimit("test-key", 3, 60)
        ).rejects.toThrow("Redis unavailable");
    });
});
