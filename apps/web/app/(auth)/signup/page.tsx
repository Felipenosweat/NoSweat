import type { Metadata } from "next";
import { AuthPage, type AuthSearchParams } from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthPage mode="signup" searchParams={searchParams} />;
}
