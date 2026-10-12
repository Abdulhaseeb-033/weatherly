import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

const { getRedisClient } = vi.hoisted(() => ({
    getRedisClient: vi.fn(),
}));

vi.mock("@/lib/server/redis/client", () => ({
    getRedisClient,
}));

import { GET } from "@/app/api/health/redis/route";

describe("GET /api/health/redis", () => {
    let redis;

    beforeEach(() => {
        vi.clearAllMocks();

        redis = {
            ping: vi.fn().mockResolvedValue("PONG"),
        };

        getRedisClient.mockResolvedValue(redis);

        vi.spyOn(console, "error").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns 200 when Redis is healthy", async () => {
        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ success: true });
        expect(redis.ping).toHaveBeenCalledOnce();
    });

    it("returns 503 when Redis is unavailable", async () => {
        getRedisClient.mockRejectedValue(
            new Error("Redis connection failed")
        );

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body).toEqual({
            success: false,
            error: "Redis connection failed.",
        });
        expect(console.error).toHaveBeenCalledWith(
            "Redis health check failed."
        );
    });

    it("returns 503 when Redis ping fails", async () => {
        redis.ping.mockRejectedValue(
            new Error("Redis ping failed")
        );

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(503);
        expect(body.success).toBe(false);
        expect(body.error).toBe("Redis connection failed.");
    });
});