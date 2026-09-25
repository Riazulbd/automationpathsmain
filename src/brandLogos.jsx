// Official brand marks (from each company's logo kit — see Automation-Tool-Logos/README.md).
// Square-ish icon versions for the small logo tiles; tools not listed here fall back
// to the hand-drawn tiles in LogoSVG.
import cloudflareMark from "./assets/logos/cloudflare-mark.png";
import dockerMark from "./assets/logos/docker-mark.svg";
import instantlyMark from "./assets/logos/instantly-mark.svg";
import n8nMark from "./assets/logos/n8n-mark.svg";
import openaiMark from "./assets/logos/openai-mark.svg";
import playwrightMark from "./assets/logos/playwright-mark.svg";
import retellMark from "./assets/logos/retell-mark.svg";
import smartleadMark from "./assets/logos/smartlead-mark.svg";
import supabaseMark from "./assets/logos/supabase-mark.svg";

export const BRAND_MARKS = {
  Cloudflare: cloudflareMark,
  Docker: dockerMark,
  Instantly: instantlyMark,
  n8n: n8nMark,
  OpenAI: openaiMark,
  Playwright: playwrightMark,
  "Retell AI": retellMark,
  Smartlead: smartleadMark,
  Supabase: supabaseMark,
};

export function BrandMark({ name, size }) {
  return (
    <img
      src={BRAND_MARKS[name]}
      alt={name}
      width={size}
      height={size}
      decoding="async"
      style={{ display: "block", width: size, height: size, objectFit: "contain" }}
    />
  );
}
