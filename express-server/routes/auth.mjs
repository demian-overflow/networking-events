import { Router } from "express";
import bcrypt from "bcrypt";
import { query } from "../db.mjs";
import { config } from "../config.mjs";
import { requireAuth } from "../middleware/auth.mjs";

const router = Router();

// POST /auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "email, password та full_name є обов'язковими" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Пароль має містити щонайменше 6 символів" });
    }

    // Check if user exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Користувач з таким email вже існує" });
    }

    // Only allow admin/organizer roles; default to organizer
    const validRoles = ["admin", "organizer"];
    const userRole = validRoles.includes(role) ? role : "organizer";

    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    const result = await query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at`,
      [email, passwordHash, full_name, userRole]
    );

    const user = result.rows[0];

    // Auto-login after registration
    req.session.userId = user.id;
    req.session.role = user.role;

    res.status(201).json({
      message: "Реєстрацію завершено",
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email та password є обов'язковими" });
    }

    const result = await query(
      "SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Невірний email або пароль" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: "Невірний email або пароль" });
    }

    req.session.userId = user.id;
    req.session.role = user.role;

    res.json({
      message: "Вхід успішний",
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Не вдалося вийти" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Вихід успішний" });
  });
});

// GET /auth/me — current session user
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      "SELECT id, email, full_name, role, created_at FROM users WHERE id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Сесію не знайдено" });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
