"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", {
      password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Sai mật khẩu. Thử lại nhé!");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài khoản</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="password"
            label="Mật khẩu Admin"
            placeholder="Nhập mật khẩu..."
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={error}
            autoFocus
          />
          <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  );
}
