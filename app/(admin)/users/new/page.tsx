"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", fbLink: "" });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    router.push("/users");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <h1 className="text-xl font-bold text-gray-900">Thêm người dùng</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col gap-4">
          <Input
            label="Họ tên"
            placeholder="VD: Nguyễn Văn A"
            value={form.name}
            onChange={set("name")}
            required
            autoFocus
          />
          <Input
            label="Số điện thoại"
            type="tel"
            placeholder="0912 345 678"
            value={form.phone}
            onChange={set("phone")}
            required
          />
          <Input
            label="Link Facebook (tùy chọn)"
            type="url"
            placeholder="https://facebook.com/..."
            value={form.fbLink}
            onChange={set("fbLink")}
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">Hủy</Button>
          <Button type="submit" loading={loading} className="flex-1">Lưu</Button>
        </div>
      </form>
    </div>
  );
}
