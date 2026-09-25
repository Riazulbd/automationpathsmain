import React from "react";

// Duotone icon set (asklepios family). Each SVG is drawn in black with a
// 20% opacity secondary layer; we swap black for currentColor so icons pick up
// the surrounding text color and both tones follow the theme.
const RAW = import.meta.glob("./duotone/*.svg", { query: "?raw", import: "default", eager: true });

const ICONS = Object.fromEntries(
  Object.entries(RAW).map(([path, svg]) => [
    path.slice("./duotone/".length, -".svg".length),
    svg
      .replace(/^[\s\S]*?<svg[^>]*>/, "")
      .replace(/<\/svg>\s*$/, "")
      .replace(/"black"/g, '"currentColor"'),
  ])
);

export default function Icon({ name, size = 20, color, className, style, title, ...rest }) {
  const body = ICONS[name];
  if (!body) {
    if (import.meta.env.DEV) console.warn(`Icon "${name}" not found in src/icons/duotone`);
    return null;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "-0.2em", color, ...style }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: body }}
      {...rest}
    />
  );
}
