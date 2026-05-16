/**
 * Site routing based on hostname (used for Vercel multi-subdomain setup).
 *
 * - retailconnect.retailpro.space  → RetailConnect product site
 * - retailpro.space (and anything else, including localhost/preview) → RetailPro landing
 *
 * Override locally with ?site=retailconnect or ?site=retailpro for testing.
 */
export type Site = "retailpro" | "retailconnect" | "modmail";

export const getSite = (): Site => {
  if (typeof window === "undefined") return "retailpro";

  const params = new URLSearchParams(window.location.search);
  const override = params.get("site");
  if (override === "retailconnect" || override === "retailpro" || override === "modmail") {
    try {
      sessionStorage.setItem("site-override", override);
    } catch {}
    return override;
  }

  try {
    const stored = sessionStorage.getItem("site-override");
    if (stored === "retailconnect" || stored === "retailpro" || stored === "modmail") return stored as Site;
  } catch {}

  const host = window.location.hostname.toLowerCase();
  if (host.startsWith("retailconnect.")) return "retailconnect";
  if (host.startsWith("modmail.")) return "modmail";
  return "retailpro";
};
