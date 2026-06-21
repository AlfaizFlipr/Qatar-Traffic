import { z } from 'zod';

export const paymentSchema = z.object({
  referenceId: z.string().trim().optional(),
  fullName: z.string().trim().min(2, 'Full name is required'),
  mobile: z
    .string()
    .trim()
    .min(6, 'Valid mobile is required')
    .regex(/^[+\d][\d\s-]{5,}$/, 'Invalid mobile number'),
  email: z.string().trim().email().optional().or(z.literal('')),
  identifier: z.string().trim().optional(),
  amount: z.number().nonnegative('Amount must be >= 0'),
  violationRefs: z.array(z.string()).optional(),
  notes: z.string().trim().max(1000).optional(),
  language: z.enum(['ar', 'en']).optional(),
});

export type PaymentBody = z.infer<typeof paymentSchema>;
