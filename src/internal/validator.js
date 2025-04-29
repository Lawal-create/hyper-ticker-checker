class ValidatorError extends Error {
  constructor(baseErr) {
    super("Validation failed");
    this.messages = {};

    baseErr.errors.forEach(issue => {
      const field = issue.path.join(".") || "unknown";
      this.messages[field] = issue.message;
    });
  }
}

/**
 * Validate the data using the given Zod schema and extract a message map if it fails
 * @param {any} data - object to validate
 * @param {import('zod').ZodSchema} schema - Zod schema to use for validation
 * @returns the parsed value by Zod or throws `ValidatorError` if validation fails
 */
function validate(data, schema) {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidatorError(result.error);
  }

  return result.data;
}

module.exports = {
  ValidatorError,
  validate
};
