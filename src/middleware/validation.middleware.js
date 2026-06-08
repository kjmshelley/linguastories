const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DANGEROUS_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function assertNoDangerousKeys(value, path = "body") {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) {
    if (DANGEROUS_KEYS.has(key)) {
      throw badRequest(`Invalid ${path} field`);
    }
    assertNoDangerousKeys(value[key], `${path}.${key}`);
  }
}

function rejectPrototypePollution(req, _res, next) {
  try {
    assertNoDangerousKeys(req.body);
    assertNoDangerousKeys(req.query, "query");
    next();
  } catch (error) {
    next(error);
  }
}

function validateUuidParam(req, _res, next, value) {
  if (!UUID_RE.test(String(value || ""))) {
    return next(badRequest("Invalid identifier"));
  }
  next();
}

function cleanString(value, { min = 0, max = 255, required = false, field = "Field", allowEmpty = false } = {}) {
  const text = String(value ?? "").trim();
  if (required && !text) throw badRequest(`${field} is required`);
  if (!allowEmpty && !required && !text) return "";
  if (text && text.length < min) throw badRequest(`${field} is too short`);
  if (text.length > max) throw badRequest(`${field} is too long`);
  return text;
}

function cleanInteger(value, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = false, field = "Field" } = {}) {
  if ((value === undefined || value === null || value === "") && !required) return undefined;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw badRequest(`${field} must be a valid number`);
  }
  return number;
}

function cleanEnum(value, options, { required = false, field = "Field", fallback = undefined } = {}) {
  if ((value === undefined || value === null || value === "") && !required) return fallback;
  if (!options.includes(value)) throw badRequest(`${field} is invalid`);
  return value;
}

function validateBody(schema, { allowEmpty = false } = {}) {
  return (req, _res, next) => {
    try {
      const input = req.body || {};
      if (!allowEmpty && (!input || typeof input !== "object" || Array.isArray(input))) {
        throw badRequest("Request body must be an object");
      }

      const allowed = new Set(Object.keys(schema));
      for (const key of Object.keys(input)) {
        if (!allowed.has(key)) {
          throw badRequest(`Unexpected field: ${key}`);
        }
      }

      const output = {};
      for (const [field, rules] of Object.entries(schema)) {
        const value = input[field];
        if (rules.type === "string") {
          output[field] = cleanString(value, { ...rules, field: rules.label || field });
        } else if (rules.type === "email") {
          const email = cleanString(value, { ...rules, field: rules.label || field }).toLowerCase();
          if (!EMAIL_RE.test(email)) throw badRequest("Email address is invalid");
          output[field] = email;
        } else if (rules.type === "password") {
          output[field] = cleanString(value, { ...rules, field: rules.label || field, max: rules.max || 256 });
        } else if (rules.type === "integer") {
          output[field] = cleanInteger(value, { ...rules, field: rules.label || field });
        } else if (rules.type === "enum") {
          output[field] = cleanEnum(value, rules.options, { ...rules, field: rules.label || field });
        } else if (rules.type === "uuid") {
          const id = cleanString(value, { ...rules, field: rules.label || field, max: 64 });
          if (id && !UUID_RE.test(id)) throw badRequest(`${rules.label || field} is invalid`);
          output[field] = id || null;
        } else if (rules.type === "dataUrl") {
          output[field] = cleanString(value, { ...rules, field: rules.label || field, max: rules.max || 8_000_000 });
        } else if (rules.type === "date") {
          const date = cleanString(value, { ...rules, field: rules.label || field, max: 32 });
          if (date && Number.isNaN(new Date(`${date}T00:00:00`).getTime())) throw badRequest(`${rules.label || field} is invalid`);
          output[field] = date;
        }
      }

      req.body = output;
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  badRequest,
  rejectPrototypePollution,
  validateBody,
  validateUuidParam
};
