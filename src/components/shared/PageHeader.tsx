import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative flex flex-col gap-3 mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-6 pb-4 pulse-line-bottom",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-h1 text-text-primary">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-body-lg text-text-secondary">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
