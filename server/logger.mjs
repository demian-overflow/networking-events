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

export function logRequest(req, res, durationMs) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const status = res.statusCode;
  const color = statusColor(status);

  console.log(
    `${colors.dim}${timestamp}${colors.reset} ` +
      `${colors.cyan}${method}${colors.reset} ${url} ` +
      `${color}${status}${colors.reset} ` +
      `${colors.dim}${durationMs}ms${colors.reset}`
  );
}
