import { config } from "../config.mjs";

const VALID_SORT_FIELDS = ["date", "title"];
const VALID_ORDER = ["asc", "desc"];

export function validateEventsQuery(req, res, next) {
  const errors = [];

  // page
  if (req.query.page !== undefined) {
    const page = Number(req.query.page);
    if (!Number.isInteger(page) || page < 1) {
      errors.push("page must be an integer >= 1");
    }
  }

  // limit
  if (req.query.limit !== undefined) {
    const limit = Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1) {
      errors.push("limit must be an integer >= 1");
    } else if (limit > config.maxLimit) {
      errors.push(`limit must not exceed ${config.maxLimit}`);
    }
  }

  // sort
  if (req.query.sort !== undefined) {
    if (!VALID_SORT_FIELDS.includes(req.query.sort)) {
      errors.push(`sort must be one of: ${VALID_SORT_FIELDS.join(", ")}`);
    }
  }

  // order
  if (req.query.order !== undefined) {
    if (!VALID_ORDER.includes(req.query.order)) {
      errors.push(`order must be one of: ${VALID_ORDER.join(", ")}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
}
