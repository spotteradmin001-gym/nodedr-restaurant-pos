import { z } from "zod";

// Self-service login for the table-QR ordering flow (apps/web/app/order/[qrToken]).
// Deliberately separate from the staff loginSchema/registerSchema in auth.ts —
// a different identity entirely (Customer, not User), scoped to one branch.

export const customerSignupSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(60),
  // Email or phone number — whichever the guest prefers to sign up with.
  identifier: z.string().trim().min(3).max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});
export type CustomerSignupDto = z.infer<typeof customerSignupSchema>;

export const customerLoginSchema = z.object({
  identifier: z.string().trim().min(3).max(200),
  password: z.string().min(4).max(200),
});
export type CustomerLoginDto = z.infer<typeof customerLoginSchema>;

export const customerSessionSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});
export type CustomerSession = z.infer<typeof customerSessionSchema>;
