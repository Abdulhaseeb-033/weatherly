import { getRedisClient } from "@/lib/server/redis/client";

export async function GET() {
    try {
        const redis = await getRedisClient();
        await redis.ping();

        return Response.json({
            success: true,
        });
    } catch {
        console.error("Redis health check failed.");

        return Response.json(
            {
                success: false,
                error: "Redis connection failed.",
            },
            { status: 503 }
        );
    }
}