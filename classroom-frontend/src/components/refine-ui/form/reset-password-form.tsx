"use client";

import { useUpdatePassword, useLink } from "@refinedev/core";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "react-router";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordForm = () => {
  const Link = useLink();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { mutate: updatePassword, isPending: isSubmitting } = useUpdatePassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error("Reset token is missing from the URL. Please request a new link.", {
        richColors: true,
      });
      return;
    }

    try {
      updatePassword(
        {
          password: values.password,
          token,
        },
        {
          onSuccess: (data) => {
            if (data.success === false) {
              toast.error(data.error?.message || "Failed to reset password. Please try again.", {
                richColors: true,
              });
              return;
            }

            toast.success("Password reset successfully! Please sign in with your new password.", {
              richColors: true,
            });
            form.reset();
          },
          onError: (error: any) => {
            toast.error(error?.message || "Failed to reset password. The link may have expired.", {
              richColors: true,
            });
          }
        }
      );
    } catch (error) {
      console.error("Reset password error:", error);
      toast.error("Failed to reset password", {
        richColors: true,
      });
    }
  };

  return (
    <div className="sign-in">
      <div className="logo">
        <img src="/logo.png" alt="Logo" />
      </div>

      <Card className="card">
        <CardHeader className="header">
          <CardTitle className="title">Reset password</CardTitle>
          <CardDescription className="description">
            Choose a new secure password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="content">
          {!token ? (
            <div className="flex flex-col items-center justify-center p-4 bg-destructive/10 text-destructive rounded-xl gap-2 mb-4">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-semibold text-center">
                Missing password reset token
              </p>
              <p className="text-xs text-center text-muted-foreground">
                Your password reset link is invalid or expired. Please return to the login page and request a new link.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="form">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="field">
                      <FormLabel htmlFor="password">New Password *</FormLabel>
                      <FormControl>
                        <InputPassword
                          id="password"
                          placeholder="Enter new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="field">
                      <FormLabel htmlFor="confirmPassword">Confirm New Password *</FormLabel>
                      <FormControl>
                        <InputPassword
                          id="confirmPassword"
                          placeholder="Confirm new password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting Password..." : "Reset Password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>

        <CardFooter className="footer">
          <Link to="/login" className="forgot-link">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to sign in</span>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

ResetPasswordForm.displayName = "ResetPasswordForm";
