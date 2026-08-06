import z from "zod";

export const subjectFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
});

export const questionFormSchema = z.object({
  text: z.string().trim().min(1, "Question text is required").max(2000),
  answer: z.string().trim().min(1, "Answer is required").max(500),
  points: z
    .number({ error: "Points must be a number" })
    .int("Points must be a whole number")
    .min(1)
    .max(1000),
});

export type SubjectFormValues = z.infer<typeof subjectFormSchema>;
export type QuestionFormValues = z.infer<typeof questionFormSchema>;
