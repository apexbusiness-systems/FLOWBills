import { Link, LinkProps } from "react-router-dom";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Props = LinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    source?: string;
    children: React.ReactNode;
  };

export function TrackLink({ to, children, source = "unknown", onClick, ...rest }: Props) {
  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLAnchorElement>) => {
      try {
        // Fire-and-forget tracking - don't block navigation
        const href = typeof to === "string" ? to : to.pathname || "unknown";

        // Use supabase edge function for tracking
        supabase.functions
          .invoke("track-click", {
            body: { href, source, ts: Date.now() },
          })
          .catch(() => {
            // Silent fail - tracking errors should not impact navigation
          });
      } catch {
        // Silent fail - tracking errors should not impact navigation
      }

      if (onClick) onClick(e);
    },
    [to, source, onClick]
  );

  return (
    <Link to={to} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
