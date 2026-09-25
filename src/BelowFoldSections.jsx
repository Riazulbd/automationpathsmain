import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import automationPathsBrandLogo from "../Automation Paths Logo (3).png";
import abidinHeadshot from "./assets/headshots/abidin.webp";
import CaseStudiesSection from "./CaseStudiesSection.jsx";
import Icon from "./icons/Icon.jsx";
import loganHeadshot from "./assets/headshots/logan.webp";
import orianaHeadshot from "./assets/headshots/oriana.webp";
import ralphHeadshot from "./assets/headshots/ralph.webp";
import tonyHeadshot from "./assets/headshots/tony.jpg";
import zacHeadshot from "./assets/headshots/zac.webp";

const services = [
  { svg: ["GoHighLevel", "HubSpot", "Salesforce"], title: "CRM Architecture", description: "Multi-pipeline CRM structures, lifecycle automation, lead scoring, segmentation, and reporting designed around how teams actually work.", tags: ["GoHighLevel", "HubSpot", "Salesforce"] },
  { svg: ["VAPI", "Retell AI", "Twilio"], title: "Voice AI Agents", description: "Production-grade assistants on real phone lines. They qualify, book, handle objections, and keep working after hours.", tags: ["VAPI", "Retell", "Twilio"] },
  { svg: ["OpenAI", "Claude AI"], title: "SMS and Chat AI", description: "Intelligent conversational AI that nurtures leads and knows exactly when to hand off to a human.", tags: ["OpenAI", "Claude", "Custom"] },
  { svg: ["OpenAI", "n8n", "Claude AI"], title: "AI Agent Orchestration", description: "Multi-agent systems that route decisions, trigger actions, and operate across your stack autonomously — no daily babysitting required.", tags: ["OpenAI", "Claude", "n8n"] },
  { svg: ["n8n", "Make"], title: "Automation Pipelines", description: "Complex workflows unifying CRM, AI agents, databases, and every third-party tool into one automated revenue machine.", tags: ["n8n", "Make", "Custom APIs"] },
  { svg: ["Instantly", "Smartlead", "Google Workspace"], title: "Email & Lifecycle Operations", description: "Segmentation, sending workflows, deliverability operations, and automation QA for more dependable lifecycle communication.", tags: ["Instantly", "Smartlead", "Google Workspace"] },
  { svg: ["Playwright", "Pipedrive", "Supabase"], title: "Revenue Infrastructure Audits", description: "Systematic diagnosis of your full revenue stack — where leads die, where routing breaks, where conversion drops — delivered as an actionable rebuild plan.", tags: ["GoHighLevel", "Pipedrive", "Supabase"] },
];

const processSteps = [
  { number: "01", title: "Diagnose", description: "Deep audit of your revenue pipeline. I find where leads die, where response time breaks, and where revenue leaks." },
  { number: "02", title: "Architect", description: "System blueprint covering CRM logic, automation flows, and AI strategy. Every decision is justified before a single thing gets built." },
  { number: "03", title: "Ship", description: "Full deployment. Voice agents, pipelines, dashboards, and integrations - wired, tested, documented, and handed over clean." },
  { number: "04", title: "Compound", description: "I monitor KPIs, refine prompts, and tune conversion paths. Your system gets smarter every week - not more fragile." },
];

const stats = [
  { value: "Extensive", label: "Client Delivery", detail: "Hands-on delivery across CRM builds, lifecycle automation, integrations, and implementation support." },
  { value: "Public", label: "Upwork Profile", detail: "A channel for reviewing consultancy history and client feedback." },
  { value: "End to end", label: "Systems Ownership", detail: "Architecture, implementation, testing, documentation, reporting, and handoff." },
  { value: "Remote", label: "Europe Relocation", detail: "Based in Bangladesh and open to relocation; no European work-authorisation claim is made." },
];

const testimonials = [
  {
    quote: "Riazul was awesome to work with. I came to him with a complex automation spanning four different applications, and he completed the project flawlessly within our agreed timeline.",
    name: "Zac Perna",
    role: "Founder, The Social Blueprint",
    initial: "ZP",
    photo: zacHeadshot,
    photoWidth: 400,
    photoHeight: 400,
    photoPosition: "center top",
    gradient: "linear-gradient(135deg,#7C6BFF,#5B6CFF)",
    dark: false,
  },
  {
    quote: "Solved complex onboarding challenges in GoHighLevel. Professional, reliable, and easy to trust with mission-critical work.",
    name: "L Henderson",
    role: "CEO, Morpheus Interactive",
    initial: "LH",
    photo: loganHeadshot,
    photoWidth: 800,
    photoHeight: 800,
    photoPosition: "center top",
    gradient: "linear-gradient(135deg,#5B6CFF,#9B72FF)",
    dark: true,
  },
  {
    quote: "Versatile, responsive, and impactful for our marketing automation. Highly recommended.",
    name: "Ralph Adetayo",
    role: "Founder, ADET IT",
    initial: "RA",
    photo: ralphHeadshot,
    photoWidth: 800,
    photoHeight: 800,
    photoPosition: "center top",
    gradient: "linear-gradient(135deg,#22C55E,#14B8A6)",
    dark: false,
  },
  {
    quote: "An amazing team member. We were glad to have Riaz helping with integrations and making the systems actually work together.",
    name: "Tony Smith",
    role: "CEO, Bizaunch.io",
    initial: "TS",
    photo: tonyHeadshot,
    photoWidth: 200,
    photoHeight: 200,
    photoPosition: "center",
    gradient: "linear-gradient(135deg,#FF8C42,#FFCB47)",
    dark: true,
  },
  {
    quote: "He was an expert in automation, lead-gen funnels, and AI. Very honest to work with and always delivered on time.",
    name: "Oriana Schneps",
    role: "CEO, The.yacht.edit",
    initial: "OS",
    photo: orianaHeadshot,
    photoWidth: 443,
    photoHeight: 444,
    photoPosition: "center top",
    gradient: "linear-gradient(135deg,#FB7185,#A855F7)",
    dark: false,
  },
  {
    quote: "Riazul and his team have deep knowledge of outreach systems, HubSpot, and marketing automation for cold outreach.",
    name: "Abidin Karabulut",
    role: "CEO, Lookum",
    initial: "AK",
    photo: abidinHeadshot,
    photoWidth: 800,
    photoHeight: 800,
    photoPosition: "center top",
    gradient: "linear-gradient(135deg,#0EA5E9,#2563EB)",
    dark: true,
  },
];

const founderBullets = [
  "The work starts with the revenue path.",
  "CRM, AI, automation, and reporting get rebuilt around that path.",
  "Every build includes architecture, QA, handoff, and clear ownership.",
];

const deliveryLanes = [
  {
    icon: "target-1",
    title: "Acquisition Systems",
    description: "Inbound capture, outbound workflows, enrichment, qualification logic, and the automations that move prospects into the right lane.",
    points: ["Lead capture flows", "Outbound sequencing", "Qualification scoring"],
  },
  {
    icon: "gear-1",
    title: "Execution Systems",
    description: "The backend layer that keeps sales and fulfillment moving: CRM states, AI touchpoints, handoffs, notifications, and QA rules.",
    points: ["Pipeline automations", "AI assistants", "Internal operating logic"],
  },
  {
    icon: "chart-bar-1",
    title: "Visibility Systems",
    description: "Clear dashboards and reporting that tell you where revenue leaks, where teams slow down, and which systems need refinement next.",
    points: ["Reporting dashboards", "Attribution clarity", "Decision-grade metrics"],
  },
];

const faqItems = [
  {
    question: "Who is this best for?",
    answer: "Agency founders, consultants, coaches, and service businesses that already have lead flow but need cleaner systems to support growth.",
  },
  {
    question: "Do you only work inside GoHighLevel?",
    answer: "No. GoHighLevel is often the core, but the work usually spans AI, telephony, automation tools, databases, custom apps, and reporting layers.",
  },
  {
    question: "What does a typical engagement look like?",
    answer: "It starts with an audit - I map your current stack, find the leaks, and define exactly what needs to be built. From there, I architect, implement, QA, document, and hand over. Most clients stay on for iterative refinement after the first build ships.",
  },
  {
    question: "Can you fix an existing stack instead of rebuilding everything?",
    answer: "Yes. Most projects actually start as cleanups - reconnecting broken automations, rationalizing pipelines, and making your current stack trustworthy again before adding anything new.",
  },
];

const notRightFitItems = [
  "Budget is the primary decision driver - I build infrastructure, not cheap fixes.",
  "You want to DIY with guidance rather than a done-for-you build.",
  "You need 24/7 availability - I work CST-compatible hours and deliver async.",
  "You're looking for a VA or task executor - I architect systems, not run errands.",
];

const strongFitItems = [
  "You're an agency owner, consultant, or coach with lead flow that's leaking at routing or conversion.",
  "You need GoHighLevel built, audited, or scaled — not just explained or trained on.",
  "You want a done-for-you revenue system with QA, documentation, and clean handoff.",
  "You work CST-compatible hours and can operate async without daily standups.",
  "You're investing in infrastructure that compounds revenue, not the cheapest path forward.",
];

const LogoSVG = ({ name, size = 20 }) => {
  const icons = {
    GoHighLevel: (
      <>
        <rect width={size} height={size} rx={4} fill="#FF6B35" />
        <path d="M4,14 L8,6 L12,10 L16,4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </>
    ),
    HubSpot: (
      <>
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#FF7A59" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.28} fill="#fff" />
        <circle cx={size * 0.25} cy={size * 0.35} r={2} fill="#fff" />
        <circle cx={size * 0.75} cy={size * 0.35} r={2} fill="#fff" />
        <circle cx={size * 0.25} cy={size * 0.65} r={2} fill="#fff" />
        <circle cx={size * 0.75} cy={size * 0.65} r={2} fill="#fff" />
      </>
    ),
    Salesforce: (
      <>
        <rect width={size} height={size} rx={4} fill="#00A1E0" />
        <path d="M3,13 Q5,7 10,8 Q15,5 17,10 Q18,14 14,14 Q12,16 8,14 Q4,15 3,13Z" fill="#fff" opacity="0.9" />
      </>
    ),
    VAPI: (
      <>
        <rect width={size} height={size} rx={4} fill="#5B6CFF" />
        <path d="M5,5 L10,15 L15,5" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    "Retell AI": (
      <>
        <rect width={size} height={size} rx={4} fill="#7C3AED" />
        <circle cx={size / 2} cy={size * 0.4} r={3} fill="none" stroke="#fff" strokeWidth="1.5" />
        <path d="M7,12 Q10,16 13,12" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
    Twilio: (
      <>
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#F22F46" />
        <circle cx={size * 0.35} cy={size * 0.42} r={2.2} fill="#fff" />
        <circle cx={size * 0.65} cy={size * 0.42} r={2.2} fill="#fff" />
        <circle cx={size * 0.5} cy={size * 0.68} r={2.2} fill="#fff" />
      </>
    ),
    OpenAI: (
      <>
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#10A37F" />
        <path d="M6,10 A4,4 0 0,1 10,6 M10,6 A4,4 0 0,1 14,10 M14,10 A4,4 0 0,1 10,14 M10,14 A4,4 0 0,1 6,10" stroke="#fff" strokeWidth="1.5" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={1.5} fill="#fff" />
      </>
    ),
    "Claude AI": (
      <>
        <rect width={size} height={size} rx={4} fill="#D97706" />
        <circle cx={size / 2} cy={size * 0.45} r={4} fill="#fff" opacity="0.9" />
        <path d="M7,13 L10,11 L13,13" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </>
    ),
    n8n: (
      <>
        <rect width={size} height={size} rx={4} fill="#EA4C89" />
        <circle cx={size * 0.32} cy={size / 2} r={2.5} fill="none" stroke="#fff" strokeWidth="1.5" />
        <circle cx={size * 0.68} cy={size / 2} r={2.5} fill="none" stroke="#fff" strokeWidth="1.5" />
        <line x1={size * 0.44} y1={size / 2} x2={size * 0.56} y2={size / 2} stroke="#fff" strokeWidth="1.5" />
      </>
    ),
    "Next.js": (
      <>
        <circle cx={size / 2} cy={size / 2} r={size / 2} fill="#000" />
        <text x={size / 2} y={size * 0.65} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="sans-serif">N</text>
      </>
    ),
    Supabase: (
      <>
        <rect width={size} height={size} rx={4} fill="#3ECF8E" />
        <path d="M10,4 L10,11 L16,16 L10,11 L4,16 L10,11Z" fill="#fff" opacity="0.9" />
      </>
    ),
    Cloudflare: (
      <>
        <rect width={size} height={size} rx={4} fill="#F48120" />
        <path d="M4,12 Q6,8 10,9 Q12,7 15,9 Q17,9 17,12 Z" fill="#fff" opacity="0.9" />
        <path d="M6,12 Q7,10 10,10.5 Q11,9 13,10 Q14.5,10 14.5,12 Z" fill="#fffce8" opacity="0.7" />
      </>
    ),
    Docker: (
      <>
        <rect width={size} height={size} rx={4} fill="#2496ED" />
        <rect x="3" y="9" width="14" height="6" rx="1" fill="#fff" opacity="0.9" />
        <rect x="5" y="5" width="3" height="3" rx="0.5" fill="#fff" opacity="0.7" />
        <rect x="9" y="5" width="3" height="3" rx="0.5" fill="#fff" opacity="0.7" />
      </>
    ),
    Make: (
      <>
        <rect width={size} height={size} rx={4} fill="#6B21A8" />
        <circle cx={size * 0.35} cy={size / 2} r={2.8} fill="#fff" opacity="0.9" />
        <circle cx={size * 0.65} cy={size / 2} r={2.8} fill="#fff" opacity="0.9" />
      </>
    ),
    Pipedrive: (
      <>
        <rect width={size} height={size} rx={4} fill="#17313B" />
        <path d="M6,15 V5 H11.5 Q15,5 15,8.4 Q15,11.8 11.5,11.8 H9.2 V15 Z" fill="#fff" />
      </>
    ),
    Playwright: (
      <>
        <rect width={size} height={size} rx={4} fill="#2D4552" />
        <circle cx={size * 0.35} cy={size * 0.42} r={2} fill="#E8585D" />
        <circle cx={size * 0.65} cy={size * 0.42} r={2} fill="#47B560" />
        <path d="M5,13 Q10,16 15,13" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </>
    ),
    Instantly: (
      <>
        <rect width={size} height={size} rx={4} fill="#7C3AED" />
        <path d="M5,10 H15" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10,5 L15,10 L10,15" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    Smartlead: (
      <>
        <rect width={size} height={size} rx={4} fill="#0F766E" />
        <path d="M5,12 Q8,6 13,8 Q15,9 15,12 Q15,15 11,15 H7" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <circle cx={size * 0.4} cy={size * 0.45} r={1.4} fill="#fff" />
      </>
    ),
    "Google Workspace": (
      <>
        <rect width={size} height={size} rx={4} fill="#1A73E8" />
        <path d="M6,5 H14 L16,8 V15 H4 V8 Z" fill="#fff" opacity="0.92" />
        <path d="M6,5 L10,10 L14,5" stroke="#1A73E8" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {icons[name] || <rect width={size} height={size} rx={4} fill="#888" />}
    </svg>
  );
};

function useCountUp(end, duration, trigger) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger || end === 0) return;
    const t0 = performance.now();
    let id;
    function step(t) {
      const p = Math.min((t - t0) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(ease * end);
      if (p < 1) id = requestAnimationFrame(step);
      else setVal(end);
    }
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [trigger, end, duration]);
  return val;
}

function useReveal(threshold = 0.12) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return undefined; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

const SectionReveal = ({ children, delay = 0 }) => {
  const [ref, visible] = useReveal(0.08);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.85s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.95s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

const StatCard = ({ stat, index, theme, compact, clay, typography }) => {
  const [ref, visible] = useReveal(0.2);
  const rawNum = stat.numeric ?? null;
  const count = useCountUp(rawNum ?? 0, 1800, visible && rawNum !== null);

  let displayValue;
  if (rawNum !== null) {
    const n = rawNum % 1 === 0 ? Math.round(count).toLocaleString() : count.toFixed(2);
    displayValue = `${stat.prefix ?? ""}${n}${stat.suffix ?? ""}`;
  } else {
    displayValue = stat.value;
  }

  return (
    <div
      ref={ref}
      style={{
        background: theme.card,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 24,
        padding: compact ? "22px 18px" : "24px 20px",
        textAlign: "left",
        boxShadow: clay(theme.cardGlow),
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${index * 80}ms, transform 0.8s cubic-bezier(0.34,1.56,0.64,1) ${index * 80}ms`,
      }}
    >
      <div style={{ width: 56, height: 4, borderRadius: 999, background: theme.grad, marginBottom: 14 }} />
      <div style={{ fontFamily: typography.head, fontSize: compact ? "2.25rem" : "2.7rem", fontWeight: 800, letterSpacing: "-0.06em", lineHeight: 0.95, color: theme.text, fontVariantNumeric: "tabular-nums", marginBottom: 8 }}>
        {displayValue}
      </div>
      <div style={{ fontFamily: typography.head, fontWeight: 700, fontSize: "0.98rem", color: theme.text, marginBottom: 8 }}>{stat.label}</div>
      <p style={{ fontSize: "0.84rem", lineHeight: 1.6, color: theme.text3 }}>{stat.detail}</p>
    </div>
  );
};

const SectionLabel = ({ theme, clay, typography, children }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 14px 5px 6px",
      background: theme.card,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 999,
      fontFamily: typography.mono,
      fontSize: "0.7rem",
      fontWeight: 500,
      color: theme.chipC,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      boxShadow: clay(),
    }}
  >
    <span style={{ width: 18, height: 18, borderRadius: "50%", background: theme.grad }} />
    {children}
  </div>
);

const ServiceCard = ({ service, index, theme, compact, clay, typography }) => {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const ref = useRef(null);
  const rectRef = useRef(null);
  const frameRef = useRef(null);
  const nextTiltRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 120);
          observer.unobserve(element);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [index]);

  useEffect(() => () => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
  }, []);

  const flushTilt = useCallback(() => {
    frameRef.current = null;
    setTilt(nextTiltRef.current);
  }, []);

  const handleMove = useCallback(
    (event) => {
      if (compact) return;
      const rect = rectRef.current ?? ref.current?.getBoundingClientRect();
      if (!rect) return;
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
      nextTiltRef.current = { x, y };
      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(flushTilt);
      }
    },
    [compact, flushTilt]
  );

  const active = hovered && !compact;

  return (
    <div
      ref={ref}
      onMouseEnter={
        compact
          ? undefined
          : () => {
              rectRef.current = ref.current?.getBoundingClientRect() ?? null;
              setHovered(true);
            }
      }
      onMouseLeave={
        compact
          ? undefined
          : () => {
              if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
              }
              rectRef.current = null;
              setHovered(false);
              setTilt({ x: 0, y: 0 });
            }
      }
      onMouseMove={compact ? undefined : handleMove}
      style={{
        background: theme.card,
        border: `1.5px solid ${active ? theme.hoverBorder : theme.cardBorder}`,
        borderRadius: compact ? 22 : 24,
        padding: compact ? "24px 18px 20px" : "30px 24px 24px",
        position: "relative",
        overflow: "hidden",
        transform: visible
          ? compact
            ? "translateY(0) scale(1)"
            : `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(${active ? -10 : 0}px) scale(${active ? 1.02 : 1})`
          : "translateY(50px) scale(0.92)",
        opacity: visible ? 1 : 0,
        boxShadow: active
          ? `0 4px 8px rgba(0,0,0,${theme.iD}), 0 20px 40px rgba(0,0,0,${theme.iD * 1.8}), 0 40px 80px rgba(0,0,0,${theme.iD * 1.5}), ${theme.cardGlow}`
          : `0 2px 4px rgba(0,0,0,${theme.iD}), 0 8px 18px rgba(0,0,0,${theme.iD * 1.3}), 0 24px 48px rgba(0,0,0,${theme.iD * 1.1})`,
        transition:
          "transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.7s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s, border-color 0.4s",
        willChange: "transform",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: `linear-gradient(to bottom,rgba(255,255,255,${theme.iL * 0.65}),transparent)`,
          borderRadius: `${compact ? 22 : 24}px ${compact ? 22 : 24}px 50% 50%`,
          pointerEvents: "none",
        }}
      />

      {active && (
        <div
          style={{
            position: "absolute",
            inset: -1,
            borderRadius: compact ? 23 : 25,
            background: theme.grad,
            opacity: 0.15,
            filter: "blur(8px)",
            animation: "pulseGlow 2s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 18, position: "relative" }}>
        {service.svg.map((name, logoIndex) => (
          <div
            key={name}
            style={{
              width: compact ? 36 : 40,
              height: compact ? 36 : 40,
              borderRadius: 12,
              background: "rgba(0,0,0,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: active ? `translateY(-${3 + logoIndex * 2}px) rotate(${logoIndex % 2 === 0 ? -3 : 3}deg)` : "none",
              transition: `transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${logoIndex * 0.06}s`,
            }}
          >
            <LogoSVG name={name} size={compact ? 18 : 20} />
          </div>
        ))}
      </div>

      <h3
        style={{
          fontFamily: typography.head,
          fontSize: compact ? "1.1rem" : "1.25rem",
          fontWeight: 700,
          marginBottom: 8,
          color: theme.text,
          letterSpacing: "-0.02em",
          position: "relative",
        }}
      >
        {service.title}
      </h3>
      <p
        style={{
          fontSize: compact ? "0.85rem" : "0.88rem",
          color: theme.text2,
          lineHeight: 1.65,
          marginBottom: 16,
          position: "relative",
        }}
      >
        {service.description}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, position: "relative" }}>
        {service.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontFamily: typography.mono,
              fontSize: "0.6rem",
              fontWeight: 500,
              padding: "4px 10px",
              borderRadius: 999,
              background: theme.tagBg,
              color: theme.tagC,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

const ReviewCard = ({ item, theme, compact, clay, typography }) => {
  const isDark = item.dark;
  const background = isDark
    ? "linear-gradient(135deg, rgba(9,16,38,0.94), rgba(43,18,88,0.94), rgba(7,41,48,0.94))"
    : theme.card;
  const border = isDark ? "rgba(255,255,255,0.15)" : theme.cardBorder;
  const text = isDark ? "#F8FAFC" : theme.text;
  const text2 = isDark ? "rgba(248,250,252,0.78)" : theme.text2;
  const divider = isDark ? "rgba(255,255,255,0.22)" : "rgba(107,114,128,0.25)";

  return (
    <div
      style={{
        background,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: compact ? 24 : 28,
        padding: compact ? "22px 18px" : "26px 22px",
        boxShadow: isDark ? "0 24px 60px rgba(6,10,18,0.25)" : clay(theme.cardGlow),
        minHeight: compact ? "auto" : 316,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {isDark && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at top left, rgba(91,108,255,0.22), transparent 34%), radial-gradient(circle at bottom right, rgba(255,79,129,0.18), transparent 32%)",
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative" }}>
        <div style={{ display: "grid", gridTemplateColumns: compact ? "68px 1fr" : "76px 1fr", gap: compact ? 14 : 18, alignItems: "center", marginBottom: 20 }}>
          <div
            style={{
              width: compact ? 60 : 72,
              height: compact ? 60 : 72,
              borderRadius: "50%",
              background: item.gradient,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: typography.head,
              fontWeight: 700,
              fontSize: compact ? "0.92rem" : "1rem",
              letterSpacing: "-0.04em",
              boxShadow: isDark ? "0 12px 36px rgba(0,0,0,0.28)" : "0 12px 32px rgba(0,0,0,0.12)",
            }}
          >
            {item.photo ? (
              <img
                src={item.photo}
                alt={item.name}
                width={item.photoWidth}
                height={item.photoHeight}
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: item.photoPosition || "center",
                }}
              />
            ) : (
              item.initial
            )}
          </div>
          <div>
            <div style={{ fontFamily: typography.head, fontWeight: 700, fontSize: compact ? "1rem" : "1.08rem", lineHeight: 1.1, letterSpacing: "-0.03em" }}>{item.name}</div>
            <div style={{ color: text2, fontSize: compact ? "0.82rem" : "0.88rem", lineHeight: 1.35, marginTop: 4 }}>{item.role}</div>
          </div>
        </div>
        <div style={{ height: 1, background: divider, marginBottom: 18 }} />
        <p style={{ color: text, fontSize: compact ? "0.96rem" : "1rem", lineHeight: 1.72 }}>{item.quote}</p>
      </div>
      <div role="img" aria-label="5 out of 5 stars" style={{ display: "flex", gap: compact ? 3 : 4, marginTop: 22, position: "relative", alignItems: "center" }}>
        {[0, 1, 2, 3, 4].map((star) => (
          <Icon
            key={star}
            name="star-full"
            size={compact ? 18 : 20}
            color="#F5A623"
            style={{
              filter: isDark ? "drop-shadow(0 4px 10px rgba(0,0,0,0.24))" : "drop-shadow(0 3px 8px rgba(255,140,66,0.14))",
            }}
          />
        ))}
      </div>
    </div>
  );
};

const FaqCard = ({ item, theme, clay, typography }) => (
  <div
    style={{
      background: theme.card,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: 24,
      padding: "22px 20px",
      boxShadow: clay(theme.cardGlow),
    }}
  >
    <div style={{ fontFamily: typography.head, fontWeight: 700, fontSize: "1rem", color: theme.text, marginBottom: 10, letterSpacing: "-0.03em" }}>
      {item.question}
    </div>
    <p style={{ color: theme.text2, lineHeight: 1.7, fontSize: "0.92rem" }}>{item.answer}</p>
  </div>
);

export default function BelowFoldSections({ theme, isMobile, isTablet, clay, typography, upworkUrl }) {
  const GradText = ({ children }) => (
    <span
      style={{
        background: theme.grad,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
    >
      {children}
    </span>
  );

  return (
    <div style={{ contentVisibility: "auto", containIntrinsicSize: isMobile ? "1px 6400px" : "1px 5500px" }}>
      <section id="about" style={{ padding: isMobile ? "30px 16px 40px" : "38px 20px 56px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: isTablet ? "1fr" : "minmax(0, 1.05fr) minmax(320px, 0.95fr)", gap: 18, alignItems: "stretch" }}>
          <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 30, padding: isMobile ? "24px 18px" : "30px 30px", boxShadow: clay(theme.cardGlow) }}>
            <SectionLabel theme={theme} clay={clay} typography={typography}>Why This Structure Works</SectionLabel>
            <h2 style={{ fontFamily: typography.head, fontSize: "clamp(2rem,4.1vw,3.25rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", color: theme.text, marginTop: 18, marginBottom: 14 }}>
              More than automations. <GradText>It is operating design.</GradText>
            </h2>
            <p style={{ fontSize: "1rem", color: theme.text2, lineHeight: 1.76, maxWidth: 620, marginBottom: 20 }}>
              Most teams don't need more tools. They need their existing stack to stop contradicting itself.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {founderBullets.map((item, index) => (
                <div key={item} style={{ display: "grid", gridTemplateColumns: "26px 1fr", gap: 12, alignItems: "start" }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: index === 1 ? theme.chipBg : "rgba(255,255,255,0.8)", color: theme.a1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: typography.mono, fontSize: "0.68rem", border: `1px solid ${theme.cardBorder}` }}>
                    +
                  </div>
                  <div style={{ color: theme.text, fontWeight: 600, lineHeight: 1.55 }}>{item}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: `linear-gradient(135deg,${theme.bgDark},${theme.card})`, border: `1px solid ${theme.cardBorder}`, borderRadius: 30, padding: isMobile ? "24px 18px" : "26px 24px", boxShadow: clay(theme.cardGlow) }}>
              <div style={{ fontFamily: typography.mono, fontSize: "0.7rem", color: theme.chipC, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                What you leave with
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {["Documented CRM logic", "Reliable lead routing", "Automation QA and ownership", "Reporting your team trusts"].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, color: theme.text, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: theme.a1, boxShadow: `0 0 0 6px ${theme.chipBg}` }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 30, padding: isMobile ? "24px 18px" : "26px 24px", boxShadow: clay(theme.cardGlow) }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
                {[
                  { title: "Audit", copy: "Identify the leaks before building." },
                  { title: "Build", copy: "Implement with testing, not guesswork." },
                  { title: "Handoff", copy: "Docs, ownership, and training included." },
                  { title: "Refine", copy: "Keep improving conversion over time." },
                ].map((item) => (
                  <div key={item.title} style={{ padding: "14px 12px", borderRadius: 18, background: theme.tagBg }}>
                    <div style={{ fontFamily: typography.head, fontWeight: 700, fontSize: "1rem", color: theme.text, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: "0.84rem", lineHeight: 1.55, color: theme.text2 }}>{item.copy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" style={{ padding: isMobile ? "64px 16px" : "80px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: isTablet ? "1fr" : "0.9fr 1.1fr", gap: 18, alignItems: "stretch" }}>
          <div style={{ background: `linear-gradient(135deg,${theme.bgDark},${theme.card})`, border: `1px solid ${theme.cardBorder}`, borderRadius: 30, padding: isMobile ? 24 : 34, boxShadow: clay(theme.cardGlow) }}>
            <SectionLabel theme={theme} clay={clay} typography={typography}>Professional profile</SectionLabel>
            <h2 style={{ fontFamily: typography.head, fontSize: "clamp(2rem,4vw,3.1rem)", lineHeight: 1.08, letterSpacing: "-0.04em", color: theme.text, margin: "18px 0 14px" }}>Consultancy delivery with in-house operations relevance.</h2>
            <p style={{ color: theme.text2, lineHeight: 1.75, margin: 0 }}>I run Automation Paths as an automation consultancy and am also open to full-time CRM, marketing automation, marketing operations, lifecycle, and revenue-systems roles in Europe. I am currently based in Bangladesh and would require the appropriate relocation and work-authorisation route.</p>
          </div>
          <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 30, padding: isMobile ? 24 : 34, boxShadow: clay(theme.cardGlow) }}>
            <h3 style={{ fontFamily: typography.head, color: theme.text, fontSize: "1.35rem", margin: "0 0 18px" }}>Verified areas of focus</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 24 }}>
              {["CRM architecture", "Lifecycle email & SMS automation", "Lead routing & segmentation", "APIs & webhooks", "Workflow integrations", "Attribution & reporting", "Automation QA", "n8n", "Zapier"].map((skill) => <span key={skill} style={{ padding: "8px 11px", borderRadius: 999, background: theme.tagBg, color: theme.tagC, fontSize: "0.82rem", fontWeight: 650 }}>{skill}</span>)}
            </div>
            <p style={{ color: theme.text2, lineHeight: 1.7, margin: "0 0 18px" }}>Recruiters can review the selected work below or contact me directly. Consultancy clients can continue to use the established Upwork route.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <a href="mailto:hello@automationpaths.com?subject=Full-time%20role%20in%20Europe" style={{ padding: "12px 18px", borderRadius: 999, background: theme.grad, color: "#fff", textDecoration: "none", fontWeight: 700 }}>Email about a full-time role</a>
              <a href={upworkUrl} target="_blank" rel="noreferrer" style={{ padding: "12px 18px", borderRadius: 999, background: theme.card, color: theme.text, border: `1px solid ${theme.cardBorder}`, textDecoration: "none", fontWeight: 700 }}>View Upwork profile</a>
            </div>
          </div>
        </div>
      </section>

      <section id="services" style={{ padding: isMobile ? "64px 16px" : "80px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <SectionReveal>
          <div style={{ marginBottom: 40 }}>
            <SectionLabel theme={theme} clay={clay} typography={typography}>What I Build</SectionLabel>
            <h2 style={{ fontFamily: typography.head, fontSize: "clamp(2.2rem,4.5vw,3.4rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", color: theme.text, marginTop: 16, marginBottom: 12 }}>
              Seven revenue systems. <GradText>One compound engine.</GradText>
            </h2>
            <p style={{ fontSize: "1.05rem", color: theme.text2, maxWidth: 540, lineHeight: 1.7 }}>
              Every engagement is built around one outcome: a revenue stack that captures leads cleanly, routes them correctly, and gives you numbers you can actually trust - not dashboards you ignore.
            </p>
          </div>
          </SectionReveal>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {services.map((service, index) => (
              <ServiceCard key={service.title} service={service} index={index} theme={theme} compact={isMobile} clay={clay} typography={typography} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "0 16px 56px" : "0 20px 76px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "grid", gridTemplateColumns: isTablet ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {deliveryLanes.map((lane) => (
            <div key={lane.title} style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 28, padding: isMobile ? "22px 18px" : "24px 22px", boxShadow: clay(theme.cardGlow) }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: theme.chipBg, color: theme.a1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", marginBottom: 16 }}>
                <Icon name={lane.icon} size={24} />
              </div>
              <h3 style={{ fontFamily: typography.head, fontSize: "1.18rem", fontWeight: 700, letterSpacing: "-0.03em", color: theme.text, marginBottom: 10 }}>
                {lane.title}
              </h3>
              <p style={{ color: theme.text2, lineHeight: 1.7, fontSize: "0.92rem", marginBottom: 18 }}>{lane.description}</p>
              <div style={{ display: "grid", gap: 8 }}>
                {lane.points.map((point) => (
                  <div key={point} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: "0.84rem", color: theme.text, fontWeight: 600 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: theme.a1 }} />
                    {point}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="process"
        style={{
          background: `linear-gradient(135deg,${theme.bgDark},${theme.card} 72%)`,
          border: `1px solid ${theme.cardBorder}`,
          borderRadius: isMobile ? 28 : 36,
          margin: isMobile ? "0 12px" : "0 16px",
          padding: isMobile ? "52px 18px" : "64px 32px",
          position: "relative",
          overflow: "hidden",
          zIndex: 1,
          boxShadow: clay(theme.cardGlow),
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 40% 40% at 20% 80%,${theme.glow1},transparent), radial-gradient(ellipse 35% 35% at 80% 20%,${theme.glow2},transparent)`, pointerEvents: "none", opacity: 0.9 }} />
        <div style={{ maxWidth: 1140, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 6px", background: "rgba(255,255,255,0.72)", border: `1px solid ${theme.cardBorder}`, borderRadius: 999, fontFamily: typography.mono, fontSize: "0.7rem", fontWeight: 500, color: theme.a1, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16, boxShadow: clay() }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: theme.grad }} />
            How I Work
          </div>
          <h2 style={{ fontFamily: typography.head, fontSize: "clamp(2.1rem,4vw,3.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", color: theme.text, marginBottom: 12 }}>
            Architecture through handoff. <GradText>Not just configuration.</GradText>
          </h2>
          <p style={{ fontSize: "1rem", color: theme.text2, maxWidth: 500, lineHeight: 1.7, marginBottom: 40 }}>
            I map requirements, design workflows, implement integrations, test edge cases, document the system, and support a clean handoff.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, width: "100%" }}>
            {processSteps.map((step) => (
              <div key={step.number} style={{ background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)", border: `1px solid ${theme.cardBorder}`, borderRadius: 24, padding: "28px 20px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: clay(theme.cardGlow) }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: `linear-gradient(to bottom,${theme.chipBg},transparent)`, borderRadius: "24px 24px 50% 50%" }} />
                <div style={{ fontFamily: typography.display, fontSize: "2.5rem", fontWeight: 900, background: theme.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", opacity: 0.58, lineHeight: 1, marginBottom: 12, position: "relative" }}>{step.number}</div>
                <h3 style={{ fontFamily: typography.head, fontSize: "1.15rem", fontWeight: 700, color: theme.text, marginBottom: 6, position: "relative" }}>{step.title}</h3>
                <p style={{ fontSize: "0.83rem", color: theme.text2, lineHeight: 1.6, position: "relative" }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="results" style={{ padding: isMobile ? "64px 16px" : "80px 20px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <SectionReveal>
            <SectionLabel theme={theme} clay={clay} typography={typography}>Results</SectionLabel>
            <h2 style={{ fontFamily: typography.head, fontSize: "clamp(2.1rem,4vw,3.2rem)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-0.03em", color: theme.text, marginTop: 18, marginBottom: 12 }}>
              Strong systems leave <GradText>visible evidence.</GradText>
            </h2>
            <p style={{ fontSize: "1rem", color: theme.text2, maxWidth: 700, lineHeight: 1.74, marginBottom: 34 }}>
              Better systems show up in delivery speed, cleaner handoffs, stronger reporting, and client feedback that speaks for itself.
            </p>
          </SectionReveal>

          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))", gap: 14, width: "100%", marginBottom: 22 }}>
            {stats.map((stat, index) => (
              <StatCard key={stat.label} stat={stat} index={index} theme={theme} compact={isMobile} clay={clay} typography={typography} />
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, width: "100%" }}>
            {testimonials.map((item) => (
              <ReviewCard key={item.name} item={item} theme={theme} compact={isMobile} clay={clay} typography={typography} />
            ))}
          </div>
        </div>
      </section>

      <CaseStudiesSection
        theme={theme}
        isMobile={isMobile}
        isTablet={isTablet}
        clay={clay}
        typography={typography}
      />

      <section style={{ padding: isMobile ? "0 16px 56px" : "0 20px 72px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <SectionReveal>
            <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 30px" }}>
              <SectionLabel theme={theme} clay={clay} typography={typography}>Strong Fit</SectionLabel>
              <h2 style={{ fontFamily: typography.head, fontSize: "clamp(1.9rem,3.9vw,3rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", color: theme.text, marginTop: 18, marginBottom: 12 }}>
                You'll get the most from this <GradText>if you recognize yourself here.</GradText>
              </h2>
              <p style={{ color: theme.text2, lineHeight: 1.74, fontSize: "1rem" }}>
                The best projects start with the right fit. Here's who this work is built for.
              </p>
            </div>
          </SectionReveal>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            {strongFitItems.map((item, i) => (
              <SectionReveal key={item} delay={i * 60}>
                <div style={{ background: theme.card, border: `1px solid rgba(20,168,0,0.18)`, borderRadius: 24, padding: "22px 20px", boxShadow: clay(theme.cardGlow), display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, alignItems: "start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(20,168,0,0.1)", color: "#14A800", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.88rem", fontWeight: 700, flexShrink: 0 }}>
                    <Icon name="check" size={16} />
                  </div>
                  <p style={{ color: theme.text, lineHeight: 1.7, fontSize: "0.96rem" }}>{item}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "0 16px 56px" : "0 20px 72px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <SectionReveal>
            <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 30px" }}>
              <SectionLabel theme={theme} clay={clay} typography={typography}>Fit Check</SectionLabel>
              <h2 style={{ fontFamily: typography.head, fontSize: "clamp(1.9rem,3.9vw,3rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", color: theme.text, marginTop: 18, marginBottom: 12 }}>
                This Isn't the Right Engagement If
              </h2>
              <p style={{ color: theme.text2, lineHeight: 1.74, fontSize: "1rem" }}>
                The strongest projects start with clean expectations on scope, ownership, and the kind of build you actually need.
              </p>
            </div>
          </SectionReveal>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            {notRightFitItems.map((item, i) => (
              <SectionReveal key={item} delay={i * 60}>
                <div style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 24, padding: "22px 20px", boxShadow: clay(theme.cardGlow), display: "grid", gridTemplateColumns: "28px 1fr", gap: 12, alignItems: "start" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: theme.chipBg, color: theme.a1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: typography.mono, fontSize: "0.78rem", fontWeight: 600 }}>
                    -
                  </div>
                  <p style={{ color: theme.text, lineHeight: 1.7, fontSize: "0.96rem" }}>{item}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" style={{ padding: isMobile ? "0 16px 56px" : "0 20px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 740, margin: "0 auto 30px" }}>
            <SectionLabel theme={theme} clay={clay} typography={typography}>FAQ</SectionLabel>
            <h2 style={{ fontFamily: typography.head, fontSize: "clamp(1.9rem,3.9vw,3rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.04em", color: theme.text, marginTop: 18, marginBottom: 12 }}>
              Questions clients usually ask <GradText>before hiring.</GradText>
            </h2>
            <p style={{ color: theme.text2, lineHeight: 1.74, fontSize: "1rem" }}>
              Most projects start with the same few questions around scope, stack compatibility, and whether to fix or rebuild.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            {faqItems.map((item) => (
              <FaqCard key={item.question} item={item} theme={theme} clay={clay} typography={typography} />
            ))}
          </div>
        </div>
      </section>

      <section id="cta" style={{ padding: isMobile ? "56px 16px 72px" : "60px 20px 80px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 760, margin: "0 auto", background: `linear-gradient(135deg,${theme.chipBg},rgba(255,230,230,0.06),${theme.tagBg})`, border: `1px solid ${theme.cardBorder}`, borderRadius: isMobile ? 28 : 36, padding: isMobile ? "40px 22px" : "56px 36px", boxShadow: `0 4px 8px rgba(0,0,0,${theme.iD}), 0 20px 50px rgba(0,0,0,${theme.iD * 1.5}), 0 40px 100px rgba(0,0,0,${theme.iD}), ${theme.cardGlow}` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px 5px 6px", background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 999, fontFamily: typography.mono, fontSize: "0.7rem", fontWeight: 500, color: theme.chipC, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 16, boxShadow: clay() }}>
            <span style={{ width: 18, height: 18, borderRadius: "50%", background: theme.grad }} />
            Consultancy or full-time
          </div>
          <h2 style={{ fontFamily: typography.head, fontSize: "clamp(1.9rem,3.5vw,2.7rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", color: theme.text, marginBottom: 12 }}>
            Need a systems partner—or a
            <br />
            <GradText>marketing operations specialist?</GradText>
          </h2>
          <p style={{ fontSize: "1.02rem", color: theme.text2, maxWidth: 450, margin: "0 auto 28px", lineHeight: 1.7 }}>
            For consultancy work, share the workflow or CRM challenge. For a full-time role, tell me about the team, scope, location, and relocation process.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
            <a href="mailto:hello@automationpaths.com" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "15px 28px", width: isMobile ? "100%" : "auto", background: theme.grad, color: "#fff", borderRadius: 999, fontWeight: 700, fontSize: "0.95rem", textDecoration: "none", boxShadow: `${theme.btnGlow}, inset 0 2px 6px rgba(255,255,255,0.25)` }}>Email Riazul</a>
            <a href={upworkUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "15px 24px", width: isMobile ? "100%" : "auto", background: theme.card, color: theme.text, border: `1px solid ${theme.cardBorder}`, borderRadius: 999, fontWeight: 700, textDecoration: "none" }}>Upwork profile</a>
          </div>
        </div>
      </section>

      <footer style={{ padding: isMobile ? "16px 16px 32px" : "24px 20px 32px", maxWidth: 1140, margin: "0 auto", display: "flex", justifyContent: isMobile ? "center" : "space-between", alignItems: "center", flexWrap: "wrap", textAlign: isMobile ? "center" : "left", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 8 : 20, flexWrap: "wrap", justifyContent: "center", width: isMobile ? "100%" : "auto" }}>
          <img
            src={automationPathsBrandLogo}
            alt="Automation Paths"
            width="200"
            height="50"
            loading="lazy"
            decoding="async"
            style={{
              display: "block",
              height: isMobile ? 28 : 32,
              width: "auto",
              objectFit: "contain",
            }}
          />
          <span style={{ fontSize: "0.75rem", color: theme.text3 }}>(c) 2026 All rights reserved.</span>
        </div>
        <a
          href={upworkUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 999,
            background: theme.card,
            border: `1px solid ${theme.cardBorder}`,
            boxShadow: clay(theme.cardGlow),
            textDecoration: "none",
            color: theme.text,
            fontWeight: 700,
            fontSize: "0.86rem",
            animation: "footerCtaBob 6s ease-in-out 1.2s infinite",
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#14A800", boxShadow: "0 0 0 5px rgba(20,168,0,0.14)" }} />
          <span>Hire on Upwork</span>
        </a>
      </footer>

      <div style={{ height: isMobile ? 16 : 90 }} />
    </div>
  );
}
