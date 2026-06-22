import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import nodemailer from "nodemailer";

import { db } from "../db/index.js";
import * as schema from "../db/schema/auth.js";

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
      },
    })
  : null;

export const auth = betterAuth({
  baseURL : process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET!,
  trustedOrigins: [process.env.FRONTEND_URL!],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      console.log("\n=========================================");
      console.log("PASSWORD RESET REQUEST");
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`Reset Token: ${token}`);
      console.log(`Reset URL: ${url}`);
      console.log("=========================================\n");

      if (transporter) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || `"Classroom Support" <noreply@localhost>`,
            to: user.email,
            subject: "Reset Your Password - Classroom Management",
            text: `Hello ${user.name},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${url}\n\nThis link will expire soon.\n\nBest regards,\nClassroom Team`,
            html: `<p>Hello ${user.name},</p><p>You requested to reset your password. Click the link below to reset it:</p><p><a href="${url}">${url}</a></p><p>This link will expire soon.</p><p>Best regards,<br/>Classroom Team</p>`,
          });
          console.log(`Reset password email sent successfully to ${user.email}`);
        } catch (error) {
          console.error(`Failed to send password reset email to ${user.email}:`, error);
        }
      } else {
        console.log("SMTP is not configured. Email was not sent. Use the reset link logged above.");
      }
    },
  },
  /* socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_google_client_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_google_client_secret",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "placeholder_github_client_id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "placeholder_github_client_secret",
    },
  }, */
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: true, // Allow role to be set during registration
      },
      imageCldPubId: {
        type: "string",
        required: false,
        input: true, // Allow imageCldPubId to be set during registration
      },
    },
  },
});
