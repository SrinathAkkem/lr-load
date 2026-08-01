export function LegalPageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
      {subtitle && (
        <p className="mt-2 text-sm font-semibold text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}
