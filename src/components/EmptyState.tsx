import type { ReactNode } from "react";

/**
 * Consistent empty / not-found / error placeholder: an icon, a title, an
 * optional message, and optional action buttons or links as children.
 */
export function EmptyState({
  icon,
  title,
  message,
  bare = false,
  children,
}: {
  icon?: ReactNode;
  title: string;
  message?: ReactNode;
  /** Render without the card chrome (for inline list filters). */
  bare?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={bare ? "empty" : "card empty"}>
      {icon}
      <h2>{title}</h2>
      {message ? <p>{message}</p> : null}
      {children}
    </div>
  );
}
