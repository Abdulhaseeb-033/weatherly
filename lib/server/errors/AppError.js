export class AppError extends Error {
    constructor(message, code, status, options = {}) {
        super(message);

        this.name = "AppError";
        this.code = code;
        this.status = status;
        this.retryAfter = options.retryAfter ?? null;
    }
}