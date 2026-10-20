import type { Metadata } from "next";
import { AuthPage, type AuthSearchParams } from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthPage mode="forgot" searchParams={searchParams} />;
}
