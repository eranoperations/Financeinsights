import { AuthForm } from "@/components/AuthForm";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <AuthForm mode="register" next={(await searchParams).next} />;
}
