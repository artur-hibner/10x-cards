import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  password: z.string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Hasła muszą być identyczne",
  path: ["password_confirmation"],
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
});

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
  password_confirmation: z.string(),
  token: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Hasła muszą być identyczne",
  path: ["password_confirmation"],
}); 