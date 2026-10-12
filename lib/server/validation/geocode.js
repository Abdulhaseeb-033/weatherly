import { z } from "zod";

export const geocodeQuerySchema = z.object({
    q: z
        .string()
        .trim()
        .min(2, "Search query must be at least 2 characters.")
        .max(100, "Search query must be less than 100 characters."),


    language: z
        .enum(["en", "ur"])
        .default("en"),
});