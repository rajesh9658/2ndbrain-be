import { Request, Response, NextFunction } from "express";
import Jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = "process.env.JWT_SECRET";

// Extend the Request type to include `userId`
// declare global {
//     namespace Express {
//         interface Request {
//             userId?: string;
//         }
//     }
// }

export const middleware = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers["authorization"];
    if (!header) {
        res.status(401).json({
            message: "No token provided",
        });
        return;
    }

    try {
        const decoded = Jwt.verify(header as string, JWT_SECRET);

        if (typeof decoded === "string") {
            res.status(403).json({
                message: "You are not logged in",
            });
            return;
        }

        // Attach `userId` to the `req` object
        req.userId = (decoded as JwtPayload).id;
        next(); // Pass control to the next middleware or route handler
    } catch (error) {
        res.status(403).json({
            message: "Invalid or expired token",
        });
    }
};
