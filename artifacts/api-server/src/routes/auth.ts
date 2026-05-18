import { Router } from "express";

const router = Router();

const USERS: Record<string, string> = {
  admin: "admin123",
};

declare module "express-session" {
  interface SessionData {
    user?: { username: string };
  }
}

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required." });
    return;
  }
  if (USERS[username] !== password) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }
  req.session.user = { username };
  res.json({ username });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", (req, res) => {
  if (req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.status(401).json({ error: "Not authenticated." });
  }
});

export default router;
