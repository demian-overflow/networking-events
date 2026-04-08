// Require authenticated session
export function requireAuth(req, res, next) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Необхідна авторизація" });
  }
  next();
}

// Require specific role(s)
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Необхідна авторизація" });
    }
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ error: "Недостатньо прав доступу" });
    }
    next();
  };
}
