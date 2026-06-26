const HttpError = require('./httpError')

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function isEmail(value) {
  return /^\S+@\S+\.\S+$/.test(String(value || '').trim())
}

function isStrongPassword(value) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(value || ''))
}

function isFutureDate(value) {
  return new Date(value) > new Date()
}

function validateBody(rules) {
  return (req, res, next) => {
    const errors = {}

    for (const [field, validators] of Object.entries(rules)) {
      const value = req.body[field]

      for (const validator of validators) {
        const error = validator(value, req.body)
        if (error) {
          errors[field] = error
          break
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return next(new HttpError(400, 'Validation failed', errors))
    }

    return next()
  }
}

function required(label) {
  return (value) => (String(value ?? '').trim() ? null : `${label} is required.`)
}

function minLength(label, length) {
  return (value) => (String(value ?? '').trim().length >= length ? null : `${label} must be at least ${length} characters.`)
}

function email(label) {
  return (value) => (isEmail(value) ? null : `${label} must be a valid email address.`)
}

function phone(label) {
  return (value) => (String(value ?? '').trim() ? null : `${label} is required.`)
}

function beforeToday(label) {
  return (value) => {
    if (!value) return `${label} is required.`
    return isFutureDate(value) ? `${label} cannot be in the future.` : null
  }
}

function passwordStrength(label) {
  return (value) => (isStrongPassword(value) ? null : `${label} must be at least 8 characters and include uppercase, lowercase, and a number.`)
}

function oneOf(label, allowedValues) {
  return (value) => {
    const normalized = String(value ?? '').trim()
    return allowedValues.includes(normalized) ? null : `${label} must be one of: ${allowedValues.join(', ')}.`
  }
}

function matchesField(fieldName, label) {
  return (value, body) => (String(value ?? '') === String(body[fieldName] ?? '') ? null : `${label} must match ${fieldName}.`)
}

function optional(validators = []) {
  return (value, body) => {
    if (value === undefined || value === null || String(value).trim() === '') {
      return null
    }

    for (const validator of validators) {
      const error = validator(value, body)
      if (error) return error
    }

    return null
  }
}

module.exports = {
  validateBody,
  required,
  minLength,
  email,
  phone,
  beforeToday,
  passwordStrength,
  oneOf,
  matchesField,
  optional,
  normalizeEmail,
  isStrongPassword,
}