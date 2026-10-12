import { describe, expect, it, vi } from "vitest";
import { fetchForecast } from "../lib/server/providers/openMeteo/client";

describe("fetchForecast", () => {
    it("fetches forecast successfully", async () => {
        const mockForecast = {
            latitude: 24.8608,
            longitude: 67.0104,
            timezone: "Asia/Karachi",
            current: {
                temperature_2m: 28.1,
            },
            hourly: {
                time: ["2026-10-09T12:00"],
            },
            daily: {
                time: ["2026-10-09"],
            },
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(mockForecast),
        });

        const result = await fetchForecast(24.8608, 67.0104);

        expect(result).toEqual(mockForecast);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        const requestUrl = global.fetch.mock.calls[0][0];

        expect(requestUrl).toContain("latitude=24.8608");
        expect(requestUrl).toContain("longitude=67.0104");
        expect(requestUrl).toContain("timezone=auto");
    });

    it("throws an error when Open-Meteo request fails", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        await expect(
            fetchForecast(24.8608, 67.0104)
        ).rejects.toThrow("Open-Meteo request failed: 500");
    });

    it("aborts the request when it times out", async () => {
        vi.useFakeTimers();

        global.fetch = vi.fn((url, options) => {
            return new Promise((resolve, reject) => {
                options.signal.addEventListener("abort", () => {
                    reject(
                        new DOMException(
                            "The operation was aborted.",
                            "AbortError"
                        )
                    );
                });
            });
        });

        const promise = fetchForecast(
            24.8608,
            67.0104,
            1000
        );

        const expectation = expect(promise).rejects.toThrow(
            "Open-Meteo request timed out."
        );

        await vi.advanceTimersByTimeAsync(1000);

        await expectation;

        vi.useRealTimers();
    });

    it("rejects malformed JSON from Open-Meteo", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockRejectedValue(
                new SyntaxError("Unexpected token")
            ),
        });

        await expect(
            fetchForecast(24.8608, 67.0104)
        ).rejects.toMatchObject({
            code: "UPSTREAM_INVALID_RESPONSE",
            status: 502,
        });
    });

    it.each([
        ["missing timezone", {
            current: {},
            hourly: { time: [] },
            daily: { time: [] },
        }],
        ["invalid current structure", {
            timezone: "Asia/Karachi",
            current: [],
            hourly: { time: [] },
            daily: { time: [] },
        }],
        ["missing hourly time", {
            timezone: "Asia/Karachi",
            current: {},
            hourly: {},
            daily: { time: [] },
        }],
        ["invalid daily time", {
            timezone: "Asia/Karachi",
            current: {},
            hourly: { time: [] },
            daily: { time: "not-an-array" },
        }],
    ])("rejects forecast with %s", async (_description, data) => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(data),
        });

        await expect(
            fetchForecast(24.8608, 67.0104)
        ).rejects.toMatchObject({
            code: "UPSTREAM_INVALID_RESPONSE",
            status: 502,
        });
    });

});