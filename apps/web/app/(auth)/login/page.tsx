import type { Metadata } from "next";
import { AuthPage, type AuthSearchParams } from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: { searchParams: AuthSearchParams }) {
  return <AuthPage mode="login" searchParams={searchParams} />;
}
