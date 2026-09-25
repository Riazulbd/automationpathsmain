import React from "react";

const caseStudies = [
  {
    title: "24/7 resort enquiry qualification",
    category: "Voice AI / CRM",
    problem: "A hospitality business needed a consistent way to answer inbound enquiries, qualify prospective bookings, and route follow-up when staff were unavailable.",
    contribution: "I designed and implemented the call qualification flow, calendar hand-off, follow-up automation, and CRM pipeline stages.",
    tools: ["VAPI", "Twilio", "GoHighLevel", "n8n", "Webhooks"],
    outcome: "The delivered workflow captured qualification details and created a trackable booking path in the CRM. Revenue and booking figures previously shown here are withheld until their source and attribution are confirmed.",
    measurement: "Measured through call completion, qualification fields, calendar bookings, and CRM stage movement.",
  },
  {
    title: "Lifecycle SMS education and routing",
    category: "Lifecycle automation / SMS",
    problem: "A health and wellness brand needed to engage an existing contact list at scale while keeping conversations permission-based and routing interests correctly.",
    contribution: "I implemented the conversational sequence, personalised fields, product-interest classification, tagging, and companion automation paths.",
    tools: ["GoHighLevel", "LeadConnector", "OpenAI", "n8n", "A2P 10DLC"],
    outcome: "The resulting system automated education, classification, and product-path routing. Previously published response, conversion, and revenue figures are withheld pending verification.",
    measurement: "Measured through response events, classification tags, pathway progression, and purchase-link actions in the connected systems.",
  },
  {
    title: "Multi-location CRM architecture",
    category: "CRM architecture / Lead routing",
    problem: "A multi-location agency needed shared pipeline visibility and more dependable routing and follow-up across its locations.",
    contribution: "I designed and implemented the unified CRM structure, routing logic, stage automations, reporting layer, and stale-opportunity reactivation workflow.",
    tools: ["GoHighLevel", "VAPI", "Twilio", "n8n", "Supabase", "Webhooks"],
    outcome: "The delivered architecture centralised pipeline activity and made routing, hand-offs, and reactivation trackable. Prior revenue-recovery and efficiency figures are withheld pending verification.",
    measurement: "Measured through assignment timestamps, pipeline-stage history, dashboard records, and reactivation status.",
  },
];

export default function CaseStudiesSection({ theme, isMobile, isTablet, clay, typography }) {
  return (
    <section id="case-studies" style={{ padding: isMobile ? "0 16px 64px" : "0 20px 84px", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 30px" }}>
          <div style={{ display: "inline-flex", padding: "6px 14px", borderRadius: 999, background: theme.chipBg, color: theme.chipC, fontFamily: typography.mono, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Selected work</div>
          <h2 style={{ fontFamily: typography.head, fontSize: "clamp(2.1rem,4vw,3.2rem)", lineHeight: 1.05, letterSpacing: "-0.04em", color: theme.text, margin: "18px 0 12px" }}>How I turn operational problems into working systems.</h2>
          <p style={{ color: theme.text2, lineHeight: 1.74, margin: 0 }}>Concise project summaries based on material already documented on this site. Unverified commercial metrics have been intentionally removed.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr" : "repeat(3, minmax(0, 1fr))", gap: 16 }}>
          {caseStudies.map((study) => (
            <article key={study.title} style={{ background: theme.card, border: `1px solid ${theme.cardBorder}`, borderRadius: 28, padding: isMobile ? 22 : 26, boxShadow: clay(theme.cardGlow), display: "flex", flexDirection: "column", gap: 18 }}>
              <header>
                <p style={{ fontFamily: typography.mono, color: theme.a1, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>{study.category}</p>
                <h3 style={{ fontFamily: typography.head, fontSize: "1.45rem", lineHeight: 1.15, color: theme.text, margin: 0 }}>{study.title}</h3>
              </header>
              {[['Client problem', study.problem], ['My contribution', study.contribution], ['Outcome', study.outcome], ['How it was measured', study.measurement]].map(([label, copy]) => (
                <div key={label}>
                  <h4 style={{ color: theme.text, fontSize: "0.82rem", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</h4>
                  <p style={{ color: theme.text2, fontSize: "0.9rem", lineHeight: 1.65, margin: 0 }}>{copy}</p>
                </div>
              ))}
              <div aria-label="Tools used" style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: "auto" }}>
                {study.tools.map((tool) => <span key={tool} style={{ padding: "6px 9px", borderRadius: 999, background: theme.tagBg, color: theme.tagC, fontFamily: typography.mono, fontSize: "0.68rem" }}>{tool}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
