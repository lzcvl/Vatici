import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
    email: z.string().email("Email invalido"),
    password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas nao coincidem",
    path: ["confirmPassword"],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
})

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Senha deve ter no minimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas nao coincidem",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
