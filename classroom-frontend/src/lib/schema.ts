import { z } from "zod";

// ============================================================
// Class Schema
// ============================================================
export const classSchema = z.object({
  name: z
    .string()
    .min(3, "Class name must be at least 3 characters")
    .max(255, "Class name must be at most 255 characters"),
  subjectId: z.coerce
    .number({ required_error: "Subject is required" })
    .min(1, "Subject is required"),
  teacherId: z
    .string({ required_error: "Teacher is required" })
    .min(1, "Teacher is required"),
  capacity: z.coerce
    .number({ required_error: "Capacity is required" })
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity must be at most 1000"),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
  description: z.string().optional(),
  bannerUrl: z.string().url("Invalid banner URL").optional().or(z.literal("")),
  bannerCldPubId: z.string().optional(),
});

export type ClassFormValues = z.infer<typeof classSchema>;

// ============================================================
// Subject Schema
// ============================================================
export const subjectSchema = z.object({
  name: z
    .string()
    .min(2, "Subject name must be at least 2 characters")
    .max(255, "Subject name must be at most 255 characters"),
  code: z
    .string()
    .min(2, "Subject code must be at least 2 characters")
    .max(50, "Subject code must be at most 50 characters"),
  departmentId: z.coerce
    .number({ required_error: "Department is required" })
    .min(1, "Department is required"),
  description: z.string().optional(),
});

export type SubjectFormValues = z.infer<typeof subjectSchema>;

// ============================================================
// Department Schema
// ============================================================
export const departmentSchema = z.object({
  name: z
    .string()
    .min(2, "Department name must be at least 2 characters")
    .max(255, "Department name must be at most 255 characters"),
  code: z
    .string()
    .min(2, "Department code must be at least 2 characters")
    .max(50, "Department code must be at most 50 characters"),
  description: z.string().optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;

// ============================================================
// Enrollment Schemas
// ============================================================
export const enrollSchema = z.object({
  classId: z.coerce.number().min(1, "Class is required"),
});

export type EnrollFormValues = z.infer<typeof enrollSchema>;

export const joinByCodeSchema = z.object({
  inviteCode: z
    .string()
    .min(3, "Invite code must be at least 3 characters")
    .max(50, "Invite code must be at most 50 characters"),
});

export type JoinByCodeFormValues = z.infer<typeof joinByCodeSchema>;

// ============================================================
// Auth Schemas
// ============================================================
export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
    role: z.enum(["student", "teacher"], {
      required_error: "Please select a role",
    }),
    image: z.string().url("Invalid image URL").optional().or(z.literal("")),
    imageCldPubId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

// ============================================================
// Schedule Schema
// ============================================================
export const scheduleSchema = z.object({
  day: z.string().min(1, "Day is required"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;
