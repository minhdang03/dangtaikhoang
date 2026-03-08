export function toast(message: string, type: "success" | "error" = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("show-toast", { detail: { message, type } })
  );
}
