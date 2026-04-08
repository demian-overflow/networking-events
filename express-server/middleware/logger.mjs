const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function statusColor(code) {
  if (code < 300) return colors.green;
  if (code < 400) return colors.yellow;
  return colors.red;
}

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const color = statusColor(res.statusCode);

    console.log(
      `${colors.dim}${timestamp}${colors.reset} ` +
        `${colors.cyan}${req.method}${colors.reset} ${req.originalUrl} ` +
        `${color}${res.statusCode}${colors.reset} ` +
        `${colors.dim}${duration}ms${colors.reset}`
    );
  });

  next();
}
