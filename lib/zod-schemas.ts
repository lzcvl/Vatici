import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("auth.errors.invalidEmail"),
  password: z.string().min(8, "auth.errors.passwordTooShort"),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, "auth.errors.nameTooShort"),
    email: z.string().email("auth.errors.invalidEmail"),
    password: z.string().min(8, "auth.errors.passwordTooShort"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.errors.passwordMismatch",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email("auth.errors.invalidEmail"),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "auth.errors.passwordTooShort"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.errors.passwordMismatch",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
