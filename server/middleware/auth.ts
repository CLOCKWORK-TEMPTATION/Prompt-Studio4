import { Request, Response, NextFunction } from "express";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        return next();
    }

    // If API request, return 401
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/auth')) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    // If page request, redirect to login (if you have one) or 401
    res.status(401).json({ error: "Unauthorized access" });
}

export function ensureAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
        // Add role check logic here if needed, currently assumes any auth user
        return next();
    }
    res.status(403).json({ error: "Forbidden access" });
}