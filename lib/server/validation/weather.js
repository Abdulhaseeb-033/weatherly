import { z } from "zod";

const coordinateSchema = (min, max) =>
    z
        .string()
        .min(1)
        .pipe(z.coerce.number().min(min).max(max));

export const forecastQuerySchema = z.object({
    latitude: coordinateSchema(-90, 90),
    longitude: coordinateSchema(-180, 180),
});