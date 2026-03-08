"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Sao chép", className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Đã copy!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Không thể copy", "error");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-xs font-medium transition-colors ${
        copied ? "text-green-600" : "text-blue-600 active:text-blue-800"
      } ${className}`}
    >
      {copied ? "✓ Đã copy" : label}
    </button>
  );
}
