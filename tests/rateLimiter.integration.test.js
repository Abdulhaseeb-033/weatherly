import { describe, it, expect } from "vitest";
import { getRedisClient } from "@/lib/server/redis/client";
import { checkRateLimit } from "@/lib/server/rateLimit/rateLimiter";

describe("checkRateLimit - Redis integration", () => {
    it("works with the real Redis server", async () => {
        const redis = await getRedisClient();

        const key = `test:rate-limit:${Date.now()}`;

        const first = await checkRateLimit(key, 3, 60);

        expect(first.allowed).toBe(true);
        expect(first.remaining).toBe(2);

        const second = await checkRateLimit(key, 3, 60);

        expect(second.allowed).toBe(true);
        expect(second.remaining).toBe(1);

        const third = await checkRateLimit(key, 3, 60);

        expect(third.allowed).toBe(true);
        expect(third.remaining).toBe(0);

        const fourth = await checkRateLimit(key, 3, 60);

        expect(fourth.allowed).toBe(false);
        expect(fourth.remaining).toBe(0);

        await redis.del(key);
    });
});