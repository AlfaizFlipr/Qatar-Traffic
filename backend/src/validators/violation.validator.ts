import { z } from "zod";

export const violationSearchSchema = z
  .object({
    searchType: z.enum(["vehicle", "personal", "establishment"]),
    country: z.string().min(1).default("Qatar"),
    plateType: z.string().optional(),
    plateNumber: z.string().trim().optional(),
    personalNumber: z.string().trim().optional(),
    establishmentId: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.searchType === "vehicle" && !data.plateNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["plateNumber"],
        message: "plateNumber is required for vehicle search",
      });
    }
    if (data.searchType === "personal" && !data.personalNumber) {
      ctx.addIssue({
        code: "custom",
        path: ["personalNumber"],
        message: "personalNumber is required",
      });
    }
    if (data.searchType === "establishment" && !data.establishmentId) {
      ctx.addIssue({
        code: "custom",
        path: ["establishmentId"],
        message: "establishmentId is required",
      });
    }
  });

export type ViolationSearchBody = z.infer<typeof violationSearchSchema>;

export const captchaStartSchema = z.object({
  searchType: z.enum(["vehicle", "personal", "establishment"]),
  country: z.string().min(1).default("Qatar"),
  plateType: z.string().optional(),
  plateNumber: z.string().trim().optional(),
  personalNumber: z.string().trim().optional(),
  establishmentId: z.string().trim().optional(),
});

export type CaptchaStartBody = z.infer<typeof captchaStartSchema>;

export const captchaSubmitSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  captchaCode: z.string().trim().min(1, "captchaCode is required"),
  identifier: z.string().trim().optional(),
});

export type CaptchaSubmitBody = z.infer<typeof captchaSubmitSchema>;
