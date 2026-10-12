import { describe, expect, it } from "vitest";
import nextConfig from "../next.config.mjs";

describe("Security headers", () => {
    it("configures security headers for all routes", async () => {
        const rules = await nextConfig.headers();

        const rule = rules.find(
            (item) => item.source === "/:path*"
        );

        expect(rule).toBeDefined();

        const headers = Object.fromEntries(
            rule.headers.map(({ key, value }) => [key, value])
        );

        expect(headers["X-Content-Type-Options"]).toBe("nosniff");
        expect(headers["X-Frame-Options"]).toBe("DENY");

        expect(headers["Referrer-Policy"]).toBe(
            "strict-origin-when-cross-origin"
        );

        expect(headers["Permissions-Policy"]).toBe(
            "camera=(), microphone=(), geolocation=()"
        );

        expect(headers["Content-Security-Policy"]).toBe(
            "object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
        );
    });

    it("preserves the existing React Compiler setting", () => {
        expect(nextConfig.reactCompiler).toBe(true);
    });
});