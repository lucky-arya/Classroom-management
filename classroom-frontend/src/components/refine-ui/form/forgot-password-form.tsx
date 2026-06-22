"use client";

import { ArrowLeft } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword, useLink } from "@refinedev/core";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const Link = useLink();

  const { mutate: forgotPassword, isPending: isSubmitting } = useForgotPassword();

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    forgotPassword({
      email,
    });
  };

  return (
    <div className="sign-in">
      <div className="logo">
        <img src="/logo.png" alt="Logo" />
      </div>

      <Card className="card">
        <CardHeader className="header">
          <CardTitle className="title">Forgot password</CardTitle>
          <CardDescription className="description">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        <CardContent className="content">
          <form onSubmit={handleForgotPassword} className="form">
            <div className="field">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending link..." : "Send reset link"}
            </Button>
          </form>
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

ForgotPasswordForm.displayName = "ForgotPasswordForm";
