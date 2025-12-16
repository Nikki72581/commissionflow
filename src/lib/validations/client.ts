import { z } from 'zod'

/**
 * Sanitize input by removing potentially dangerous characters and trimming whitespace
 * This helps prevent XSS attacks while preserving normal punctuation
 */
function sanitizeInput(value: string): string {
  return value
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-related content
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
}

/**
 * Schema for creating a client
 */
export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(200, 'Client name must be 200 characters or less')
    .transform(sanitizeInput)
    .refine((val) => val.length >= 1, {
      message: 'Client name cannot be empty after removing invalid characters',
    }),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * Schema for updating a client
 */
export const updateClientSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(200, 'Client name must be 200 characters or less')
    .transform(sanitizeInput)
    .refine((val) => val.length >= 1, {
      message: 'Client name cannot be empty after removing invalid characters',
    })
    .optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

/**
 * Types inferred from schemas
 */
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>