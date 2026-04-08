import { z } from "zod";

export const registrationSchema = z.object({
  fullName: z
    .string()
    .min(1, "ПІБ є обов'язковим")
    .min(3, "ПІБ має містити щонайменше 3 символи"),
  email: z
    .string()
    .min(1, "Email є обов'язковим")
    .email("Невірний формат email"),
  birthDate: z
    .string()
    .min(1, "Дата народження є обов'язковою")
    .refine(
      (val) => {
        const birth = new Date(val);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birth.getDate())
        ) {
          age--;
        }
        return age >= 18;
      },
      { message: "Вам має бути щонайменше 18 років" }
    ),
  source: z.string().min(1, "Оберіть джерело інформації"),
});

export type RegistrationData = z.infer<typeof registrationSchema>;

export const INFO_SOURCES = [
  "Соціальні мережі",
  "Рекомендація друзів",
  "Пошукова система",
  "Email-розсилка",
  "Реклама",
  "Інше",
] as const;
