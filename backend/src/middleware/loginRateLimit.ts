import type {
    NextFunction,
    Request,
    Response
} from "express";

interface AttemptBucket {
    count: number;
    resetAt: number;
}

const attempts = new Map<string, AttemptBucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

export function loginRateLimit(
    request: Request,
    response: Response,
    next: NextFunction
): void {
    const key = request.ip ?? request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || current.resetAt <= now) {
        attempts.set(key, {
            count: 1,
            resetAt: now + WINDOW_MS
        });
    } else if (current.count >= MAX_ATTEMPTS) {
        response.setHeader(
            "Retry-After",
            String(Math.ceil((current.resetAt - now) / 1000))
        );
        response.status(429).json({
            success: false,
            message:
                "Too many login attempts. Please wait 15 minutes and try again."
        });
        return;
    } else {
        current.count += 1;
    }

    response.on("finish", () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
            attempts.delete(key);
        }
    });

    next();
}
