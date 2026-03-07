"use client";
import { cn } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base outline-none transition-colors",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          "placeholder:text-gray-400",
          error && "border-red-400 focus:border-red-400 focus:ring-red-100",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base outline-none transition-colors",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          error && "border-red-400",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function TextArea({ label, className, id, ...props }: TextAreaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={3}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-base outline-none transition-colors resize-none",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          className
        )}
        {...props}
      />
    </div>
  );
}
