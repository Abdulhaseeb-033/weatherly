
import { getRedisClient } from "@/lib/server/redis/client";

const RATE_LIMIT_SCRIPT = `
    local count = redis.call("INCR", KEYS[1])

    if count == 1 or redis.call("TTL", KEYS[1]) < 0 then
        redis.call("EXPIRE", KEYS[1], ARGV[1])
    end

    local ttl = redis.call("TTL", KEYS[1])

    return { count, ttl }
`;

export async function checkRateLimit(key, limit, windowSeconds) {
    if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        !Number.isInteger(windowSeconds) ||
        windowSeconds < 1
    ) {
        throw new Error("Invalid rate-limit configuration.");
    }

    const redis = await getRedisClient();

    const [count, ttl] = await redis.eval(RATE_LIMIT_SCRIPT, {
        keys: [key],
        arguments: [String(windowSeconds)],
    });

    return {
        allowed: count <= limit,
        limit,
        remaining: Math.max(limit - count, 0),
        retryAfter: ttl > 0 ? ttl : windowSeconds,
    };
}
