import { Router } from "express";
import passport from "passport";
import { db } from "../storage";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
});

router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = registerSchema.parse(req.body);

        const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (existingUser.length > 0) {
            return res.status(400).json({ error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Using simple ID generation for now, ideally use UUID v4
        const userId = crypto.randomUUID();

        const [newUser] = await db.insert(users).values({
            id: userId,
            email,
            name,
            password: hashedPassword,
        }).returning();

        req.login(newUser, (err) => {
            if (err) return res.status(500).json({ error: "Login failed after registration" });
            const { password, ...userWithoutPassword } = newUser;
            res.json({ user: userWithoutPassword });
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

router.post("/login", passport.authenticate("local"), (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Login failed" });
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
});

router.post("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: "Logout failed" });
        res.json({ message: "Logged out successfully" });
    });
});

router.get("/me", (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
});

export default router;