import { createClient } from "redis";

const redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (error) => {
    console.error("Redis Client Error:", error.message);
});

let connectionPromise;

export async function getRedisClient() {
    if (redis.isReady) {
        return redis;
    }

    if (!connectionPromise) {
        connectionPromise = redis.connect().finally(() => {
            connectionPromise = undefined;
        });
    }

    await connectionPromise;

    return redis;
}
