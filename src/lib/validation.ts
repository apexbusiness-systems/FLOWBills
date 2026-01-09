import { z } from "zod";

// Validation schemas for form inputs
export const invoiceSchema = z.object({
  invoiceNumber: z.string()
    .min(1, "Invoice number is required")
    .max(50, "Invoice number too long")
    .regex(/^[A-Za-z0-9\-_]+$/, "Invalid invoice number format"),
  
  vendor: z.string()
    .min(1, "Vendor is required")
    .max(100, "Vendor name too long")
    .regex(/^[A-Za-z0-9\s\-&,.()]+$/, "Invalid vendor name format"),
  
  amount: z.number()
    .positive("Amount must be positive")
    .max(10000000, "Amount exceeds maximum limit")
    .multipleOf(0.01, "Amount must have at most 2 decimal places"),
  
  poNumber: z.string()
    .max(50, "PO number too long")
    .regex(/^[A-Za-z0-9\-_]*$/, "Invalid PO number format")
    .optional(),
  
  description: z.string()
    .max(500, "Description too long")
    .optional(),
  
  date: z.date()
    .max(new Date(), "Date cannot be in the future")
    .min(new Date(2020, 0, 1), "Date too old")
});

export const validationRuleSchema = z.object({
  name: z.string()
    .min(1, "Rule name is required")
    .max(100, "Rule name too long")
    .regex(/^[A-Za-z0-9\s\-_]+$/, "Invalid rule name format"),
  
  field: z.string()
    .min(1, "Field is required")
    .max(50, "Field name too long")
    .regex(/^[a-z_]+$/, "Field must be lowercase with underscores"),
  
  operator: z.enum(["equals", "contains", "greater_than", "less_than", "not_empty"]),
  
  value: z.string()
    .max(100, "Value too long"),
  
  severity: z.enum(["error", "warning", "info"]),
  
  description: z.string()
    .max(200, "Description too long")
    .optional()
});

export const searchQuerySchema = z.string()
  .max(100, "Search query too long")
  .regex(/^[A-Za-z0-9\s\-_().]+$/, "Invalid search query format");

// Get file validation config from environment
const getFileValidationConfig = () => {
  const maxSizeMB = parseInt(import.meta.env.VITE_MAX_UPLOAD_MB || '20');
  const allowedMimeTypes = (import.meta.env.VITE_ALLOWED_UPLOAD_MIME || 'application/pdf,image/jpeg,image/png').split(',').map((s: string) => s.trim());

  return {
    maxSizeBytes: maxSizeMB * 1024 * 1024,
    allowedMimeTypes
  };
};

export const fileUploadSchema = z.object({
  name: z.string()
    .min(1, "File name required")
    .max(255, "File name too long")
    .regex(/^[A-Za-z0-9\s\-_.()]+\.(pdf|xlsx?|csv|xml|jpg|jpeg|png)$/i, "Invalid file name or extension"),

  size: z.number()
    .positive("File size must be positive"),

  type: z.string()
}).refine((data) => {
  const config = getFileValidationConfig();
  return data.size <= config.maxSizeBytes;
}, (data) => ({
  message: `File size exceeds ${import.meta.env.VITE_MAX_UPLOAD_MB || '20'}MB limit`,
  path: ['size']
})).refine((data) => {
  const config = getFileValidationConfig();
  return config.allowedMimeTypes.includes(data.type);
}, (data) => ({
  message: `File type ${data.type} not allowed. Allowed types: ${getFileValidationConfig().allowedMimeTypes.join(', ')}`,
  path: ['type']
}));

// Error handler for validation
export const handleValidationError = (error: z.ZodError) => {
  return error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }));
};

// Sanitize and validate user input
export const sanitizeAndValidate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};