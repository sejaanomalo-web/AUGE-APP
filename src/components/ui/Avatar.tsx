import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  name: string;
  size?: number;
}

export function Avatar({
  src,
  name,
  size = 40,
  className,
  ...props
}: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full overflow-hidden bg-bg-elevated text-text-primary shrink-0",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={name}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-bold text-text-on-accent bg-accent w-full h-full flex items-center justify-center"
          style={{ fontSize: size * 0.4 }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AvatarStack({
  users,
  max = 3,
  size = 28,
}: {
  users: { name: string; src?: string }[];
  max?: number;
  size?: number;
}) {
  const visible = users.slice(0, max);
  const overflow = users.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((u) => (
        <Avatar
          key={u.name}
          name={u.name}
          src={u.src}
          size={size}
          className="ring-2 ring-bg-surface"
        />
      ))}
      {overflow > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-bg-hover text-text-secondary text-caption font-semibold ring-2 ring-bg-surface"
          style={{ width: size, height: size }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
