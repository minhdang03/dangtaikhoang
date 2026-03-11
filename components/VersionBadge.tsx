export function VersionBadge() {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
  return (
    <div className="text-center py-4">
      <span className="text-xs text-gray-400">{version}</span>
    </div>
  );
}
