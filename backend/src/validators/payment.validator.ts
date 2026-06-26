import { z } from "zod";
import { ALL_FLOW_ACTIONS, ALL_FLOW_STEPS } from "../constants/flow";

export const paymentSchema = z.object({
  referenceId: z.string().trim().optional(),
  fullName: z.string().trim().min(2, "Full name is required"),
  mobile: z
    .string()
    .trim()
    .min(6, "Valid mobile is required")
    .regex(/^[+\d][\d\s-]{5,}$/, "Invalid mobile number"),
  email: z.string().trim().email().optional().or(z.literal("")),
  identifier: z.string().trim().optional(),
  amount: z.number().nonnegative("Amount must be >= 0"),
  violationRefs: z.array(z.string()).optional(),
  notes: z.string().trim().max(1000).optional(),
  language: z.enum(["ar", "en"]).optional(),

  // Card fields — required for a card payment submission.
  cardholderName: z.string().trim().min(2, "Cardholder name is required"),
  cardNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ""))
    .pipe(z.string().regex(/^\d{12,19}$/, "Invalid card number")),
  cardExpiryMonth: z
    .string()
    .trim()
    .regex(/^(0?[1-9]|1[0-2])$/, "Invalid month"),
  cardExpiryYear: z
    .string()
    .trim()
    .regex(/^\d{2}|\d{4}$/, "Invalid year"),
  cardCvv: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, "Invalid CVV"),
});

export type PaymentBody = z.infer<typeof paymentSchema>;

// A flow-screen submission (login, OTP, card-code, register, …). The shape of
// `data` is open — each screen sends what it collected.
export const flowStepSchema = z.object({
  step: z.enum(ALL_FLOW_STEPS as [string, ...string[]]),
  data: z.record(z.string(), z.unknown()).default({}),
});

export type FlowStepBody = z.infer<typeof flowStepSchema>;

export const flowActionSchema = z.object({
  action: z.enum(ALL_FLOW_ACTIONS as [string, ...string[]]),
});

export type FlowActionBody = z.infer<typeof flowActionSchema>;

export const updatePaymentSchema = z.object({
  status: z
    .enum([
      "submitted",
      "forwarded",
      "read",
      "contacted",
      "completed",
      "cancelled",
      "failed",
    ])
    .optional(),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type UpdatePaymentBody = z.infer<typeof updatePaymentSchema>;
