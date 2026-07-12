// Funnel Health Diagnostic Quiz — data model.
//
// Part 1: 6 business-profile questions (NOT scored).
// Part 2: 27 diagnostic questions across 9 categories (scored, 0–3 points each).
//
// Scoring values live here for logic only. They are intentionally NEVER rendered
// to participants (see FunnelQuiz.jsx — options display text only).

export const ESTIMATED_MINUTES = "6–8 minutes";

// ---------------------------------------------------------------------------
// Part 1 — Business Profile (unscored)
// ---------------------------------------------------------------------------

export const PROFILE_QUESTIONS = [
  {
    id: 1,
    key: "business_type",
    type: "single",
    prompt: "Which best describes your business?",
    options: [
      "Coach or consultant",
      "Course creator",
      "Membership or community owner",
      "Agency or service provider",
      "Health or wellness expert",
      "Speaker, author, or personal brand",
      "Other",
    ],
  },
  {
    id: 2,
    key: "purchase_method",
    type: "single",
    prompt: "How do customers primarily purchase from you?",
    options: [
      "They purchase directly through a checkout page",
      "They submit an application and book a call",
      "They attend a webinar, workshop, or challenge",
      "They speak with us through direct messages",
      "They join through a subscription or membership",
      "We use several of these methods",
      "We do not currently have a consistent sales process",
    ],
  },
  {
    id: 3,
    key: "offer_price",
    type: "single",
    prompt: "What is the typical price of your main offer?",
    options: [
      "Under $100",
      "$100–$499",
      "$500–$1,999",
      "$2,000–$4,999",
      "$5,000 or more",
      "It varies significantly",
      "We have not launched the offer yet",
    ],
  },
  {
    id: 4,
    key: "monthly_leads",
    type: "single",
    prompt: "Approximately how many leads enter your business each month?",
    options: [
      "Fewer than 100",
      "100–499",
      "500–1,999",
      "2,000–4,999",
      "5,000 or more",
      "I do not know",
    ],
  },
  {
    id: 5,
    key: "funnel_tools",
    type: "multi",
    prompt: "Which tools are currently part of your funnel?",
    help: "Select all that apply.",
    options: [
      "Website or landing-page builder",
      "CRM or email marketing platform",
      "Checkout or payment platform",
      "Course or membership platform",
      "Calendar or appointment-booking tool",
      "Webinar or event platform",
      "ManyChat or direct-message automation",
      "Analytics or tracking platform",
      "Spreadsheet or manual reporting system",
      "Custom dashboard or internal software",
      "Other",
      "I am not sure",
    ],
  },
  {
    id: 6,
    key: "improvement_goal",
    type: "single",
    prompt: "What would you most like to improve?",
    options: [
      "Generate more qualified leads",
      "Increase sales conversions",
      "Understand where revenue comes from",
      "Fix broken automations",
      "Improve customer onboarding",
      "Reduce cancellations or churn",
      "Create better reporting",
      "Simplify my technology",
      "I am not sure what needs to be fixed",
    ],
  },
];

// ---------------------------------------------------------------------------
// Part 2 — Categories (each has 3 questions; max risk score 9 per category)
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  { id: "A", name: "Funnel Clarity", questionIds: [7, 8, 9] },
  { id: "B", name: "Traffic and Revenue Attribution", questionIds: [10, 11, 12] },
  { id: "C", name: "Lead Capture and CRM Data", questionIds: [13, 14, 15] },
  { id: "D", name: "Follow-Up and Nurturing", questionIds: [16, 17, 18] },
  { id: "E", name: "Sales Conversion and Recovery", questionIds: [19, 20, 21] },
  { id: "F", name: "Checkout and Buyer Tracking", questionIds: [22, 23, 24] },
  { id: "G", name: "Product Access and Onboarding", questionIds: [25, 26, 27] },
  { id: "H", name: "Reporting and Optimization", questionIds: [28, 29, 30] },
  { id: "I", name: "Retention and Customer Value", questionIds: [31, 32, 33] },
];

// Helper to keep option authoring terse: [text, points]
const opt = (text, points) => ({ text, points });

// ---------------------------------------------------------------------------
// Part 2 — Diagnostic Questions (scored)
// ---------------------------------------------------------------------------

export const DIAGNOSTIC_QUESTIONS = [
  // Category A — Funnel Clarity
  {
    id: 7,
    category: "A",
    prompt: "Do you have a documented map of your complete customer journey?",
    help: "This should cover the journey from first discovering your business through becoming a customer.",
    options: [
      opt("Yes, the complete journey is documented and regularly updated", 0),
      opt("We have a map, but some steps are missing or outdated", 1),
      opt("The journey is mostly understood but not properly documented", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 8,
    category: "A",
    prompt: "Does each major step of your funnel have one clear objective and next action?",
    options: [
      opt("Yes, every step has a clear objective and CTA", 0),
      opt("Most steps are clear, but a few have competing actions", 1),
      opt("Several pages or messages have unclear or competing actions", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 9,
    category: "A",
    prompt: "Can you see the conversion rate at each important stage of your funnel?",
    help: "Examples include visitor-to-lead, lead-to-call, call-to-sale, and checkout-to-purchase.",
    options: [
      opt("Yes, we track all important conversion rates", 0),
      opt("We track some stages but not the complete funnel", 1),
      opt("We rely mostly on estimates or manually calculated numbers", 2),
      opt("No, or I am not sure", 3),
    ],
  },

  // Category B — Traffic and Revenue Attribution
  {
    id: 10,
    category: "B",
    prompt: "Can you identify where each new lead originally came from?",
    options: [
      opt("Yes, the original source is automatically recorded for nearly every lead", 0),
      opt("We can identify the source for most leads", 1),
      opt("We can only identify broad sources or manually ask people", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 11,
    category: "B",
    prompt: "Do you consistently use UTM parameters or another structured source-tracking method?",
    options: [
      opt("Yes, we use a consistent naming system across all campaigns", 0),
      opt("We use tracking links, but the naming is sometimes inconsistent", 1),
      opt("We only use tracking links for selected campaigns", 2),
      opt("No, or I do not know what UTM tracking is", 3),
    ],
  },
  {
    id: 12,
    category: "B",
    prompt: "Can you connect marketing sources to actual purchases and revenue?",
    options: [
      opt("Yes, we can see leads, customers, and revenue by source or campaign", 0),
      opt("We can attribute some purchases, but the data is incomplete", 1),
      opt("We can see clicks or leads, but not reliably connect them to revenue", 2),
      opt("No, or I am not sure", 3),
    ],
  },

  // Category C — Lead Capture and CRM Data
  {
    id: 13,
    category: "C",
    prompt: "Are contacts from forms, quizzes, bookings, webinars, and other lead sources automatically added to your CRM?",
    options: [
      opt("Yes, all important sources are connected and regularly tested", 0),
      opt("Most sources are connected, but a few require manual work", 1),
      opt("Several sources are disconnected or depend on manual imports", 2),
      opt("No CRM is used, or I am not sure", 3),
    ],
  },
  {
    id: 14,
    category: "C",
    prompt: "How clean and reliable is your contact database?",
    options: [
      opt("Duplicate contacts are controlled, and important fields are standardized", 0),
      opt("There are occasional duplicates or incomplete records", 1),
      opt("Duplicate, outdated, or incomplete records are common", 2),
      opt("We have no data-cleaning process, or I am not sure", 3),
    ],
  },
  {
    id: 15,
    category: "C",
    prompt: "Can you reliably identify each contact’s current status?",
    help: "Examples include new lead, qualified lead, booked call, customer, refunded customer, and inactive customer.",
    options: [
      opt("Yes, statuses are automatically updated and reliable", 0),
      opt("Statuses exist, but they are not always accurate", 1),
      opt("We depend heavily on manual tags, notes, or spreadsheets", 2),
      opt("No, or I am not sure", 3),
    ],
  },

  // Category D — Follow-Up and Nurturing
  {
    id: 16,
    category: "D",
    prompt: "After someone submits a form, quiz, application, or booking request, how quickly do they receive the correct response?",
    options: [
      opt("Immediately or within five minutes through a tested automation", 0),
      opt("Usually within an hour", 1),
      opt("It can take several hours or requires manual follow-up", 2),
      opt("There is no consistent response, or I am not sure", 3),
    ],
  },
  {
    id: 17,
    category: "D",
    prompt: "Do leads who do not purchase receive an appropriate follow-up sequence?",
    options: [
      opt("Yes, follow-up is automated and based on their interest or behavior", 0),
      opt("Yes, but everyone receives nearly the same sequence", 1),
      opt("Follow-up is inconsistent, short, or mainly manual", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 18,
    category: "D",
    prompt: "When someone purchases, are they automatically removed from inappropriate promotional sequences?",
    options: [
      opt("Yes, buyers are immediately moved into the correct customer journey", 0),
      opt("Usually, but occasional incorrect emails still happen", 1),
      opt("This depends on manual changes or delayed updates", 2),
      opt("No, buyers may continue receiving incorrect sales messages", 3),
    ],
  },

  // Category E — Sales Conversion and Recovery
  {
    id: 19,
    category: "E",
    prompt: "Can you identify where interested prospects most commonly stop progressing?",
    help: "Examples include before booking, after booking, after an application, during checkout, or after a sales call.",
    options: [
      opt("Yes, drop-off points are clearly measured", 0),
      opt("We can identify some drop-off points", 1),
      opt("We rely mostly on assumptions or individual observations", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 20,
    category: "E",
    prompt: "Are high-intent leads followed up with quickly?",
    help: "Examples include people who submit an application, request information, book a call, or visit checkout.",
    options: [
      opt("Yes, they are automatically prioritized and contacted quickly", 0),
      opt("Usually, but the timing or process is inconsistent", 1),
      opt("Follow-up is mainly manual and can be delayed", 2),
      opt("There is no defined process, or I am not sure", 3),
    ],
  },
  {
    id: 21,
    category: "E",
    prompt: "Do you have a recovery process for prospects who stop before purchasing?",
    help: "This may include abandoned checkouts, incomplete applications, missed calls, or stalled conversations.",
    options: [
      opt("Yes, recovery is automated and tailored to the drop-off point", 0),
      opt("We have basic reminders for some situations", 1),
      opt("We occasionally follow up manually", 2),
      opt("No, or I am not sure", 3),
    ],
  },

  // Category F — Checkout and Buyer Tracking
  {
    id: 22,
    category: "F",
    prompt: "When a successful payment occurs, is the customer immediately identified as a buyer across your systems?",
    options: [
      opt("Yes, the CRM, email platform, and delivery platform update automatically", 0),
      opt("Most systems update, but some information is delayed or missing", 1),
      opt("The process depends partly on manual updates", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 23,
    category: "F",
    prompt: "Do you have a process for failed payments or abandoned checkouts?",
    options: [
      opt("Yes, customers receive timely and appropriate recovery messages", 0),
      opt("We have basic failed-payment or abandonment reminders", 1),
      opt("The process is manual or only covers some products", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 24,
    category: "F",
    prompt: "When a refund, cancellation, or chargeback occurs, are all relevant systems updated?",
    options: [
      opt("Yes, access, tags, lists, and reporting update automatically", 0),
      opt("Most systems update, but some manual work is required", 1),
      opt("Updates are mainly manual and may be delayed", 2),
      opt("No consistent process exists, or I am not sure", 3),
    ],
  },

  // Category G — Product Access and Onboarding
  {
    id: 25,
    category: "G",
    prompt: "How reliably do customers receive access to the correct product after purchasing?",
    options: [
      opt("Access is automatic, fast, and regularly tested", 0),
      opt("Access usually works, but occasional issues occur", 1),
      opt("Access may be delayed or require manual assistance", 2),
      opt("Access problems are frequent, or I am not sure", 3),
    ],
  },
  {
    id: 26,
    category: "G",
    prompt: "Do new customers receive a structured onboarding experience?",
    options: [
      opt("Yes, onboarding clearly explains access, next steps, support, and expected outcomes", 0),
      opt("Customers receive basic instructions but limited guidance", 1),
      opt("Onboarding is inconsistent or mostly manual", 2),
      opt("No structured onboarding exists", 3),
    ],
  },
  {
    id: 27,
    category: "G",
    prompt: "Can your team quickly identify when a customer has not received access or completed onboarding?",
    options: [
      opt("Yes, failed access or incomplete onboarding is automatically flagged", 0),
      opt("We can identify most issues, but only after reviewing the systems", 1),
      opt("We normally discover issues when customers contact us", 2),
      opt("We have no reliable way to identify these issues", 3),
    ],
  },

  // Category H — Reporting and Optimization
  {
    id: 28,
    category: "H",
    prompt: "Can you view your most important funnel metrics in one place?",
    options: [
      opt("Yes, we have a reliable dashboard with regularly updated data", 0),
      opt("Most metrics are available, but we still check multiple platforms", 1),
      opt("Reporting depends heavily on spreadsheets or manual calculations", 2),
      opt("No, or I am not sure which metrics to track", 3),
    ],
  },
  {
    id: 29,
    category: "H",
    prompt: "Do the numbers shown across your marketing, CRM, checkout, and delivery platforms match?",
    options: [
      opt("Yes, the data is regularly reconciled and generally consistent", 0),
      opt("There are small differences, but we understand the reasons", 1),
      opt("The platforms frequently show conflicting numbers", 2),
      opt("We have never checked, or I am not sure", 3),
    ],
  },
  {
    id: 30,
    category: "H",
    prompt: "How often do you review and improve your funnel using actual performance data?",
    options: [
      opt("At least monthly, with documented tests and decisions", 0),
      opt("Every few months or when performance changes", 1),
      opt("Only when a significant problem appears", 2),
      opt("We do not have a regular optimization process", 3),
    ],
  },

  // Category I — Retention and Customer Value
  {
    id: 31,
    category: "I",
    prompt: "Can you identify customers who have stopped engaging with your product or program?",
    options: [
      opt("Yes, inactivity is automatically tracked and flagged", 0),
      opt("We track some engagement indicators", 1),
      opt("We only notice when customers become visibly inactive or complain", 2),
      opt("No, or I am not sure", 3),
    ],
  },
  {
    id: 32,
    category: "I",
    prompt: "Do customers receive a relevant next-offer, renewal, or continuation opportunity?",
    options: [
      opt("Yes, offers are based on what they purchased and their progress", 0),
      opt("We have general upsell or renewal campaigns", 1),
      opt("Offers are sent inconsistently or manually", 2),
      opt("No structured next-offer process exists", 3),
    ],
  },
  {
    id: 33,
    category: "I",
    prompt: "Do you collect and use information about refunds, cancellations, and customer drop-off?",
    options: [
      opt("Yes, reasons are consistently collected, categorized, and reviewed", 0),
      opt("We collect some information but do not analyze it regularly", 1),
      opt("Information is collected informally through support conversations", 2),
      opt("No, or I am not sure", 3),
    ],
  },
];

// ---------------------------------------------------------------------------
// Critical Override Rules — show a prominent warning when the participant
// scores 2 or 3 points on any of these questions.
// ---------------------------------------------------------------------------

export const CRITICAL_QUESTIONS = {
  12: "Connecting marketing sources to revenue",
  18: "Removing buyers from incorrect promotions",
  22: "Successful-payment tracking",
  24: "Refund and cancellation synchronization",
  25: "Product-access delivery",
};

// ---------------------------------------------------------------------------
// Overall Result Levels (based on the 0–100 Funnel Health Score)
// ---------------------------------------------------------------------------

export const RESULT_LEVELS = [
  {
    min: 85,
    max: 100,
    name: "Strong and Scalable",
    blurb:
      "Your core funnel infrastructure is healthy. Your biggest opportunities are likely optimization, advanced attribution, and increasing customer value.",
  },
  {
    min: 70,
    max: 84,
    name: "Functional with Hidden Leaks",
    blurb:
      "Your funnel is operating, but several gaps may be reducing conversions, creating manual work, or producing unreliable data.",
  },
  {
    min: 50,
    max: 69,
    name: "Revenue Leakage Risk",
    blurb:
      "Important parts of your tracking, follow-up, sales, or customer journey are disconnected. These gaps are likely costing revenue.",
  },
  {
    min: 0,
    max: 49,
    name: "Critical Funnel Blindness",
    blurb:
      "Your business has limited visibility into how leads become customers. Broken connections or missing processes may be causing substantial revenue loss.",
  },
];

// ---------------------------------------------------------------------------
// Category severity bands (each category is scored 0–9)
// ---------------------------------------------------------------------------

export const CATEGORY_LEVELS = [
  { min: 0, max: 2, label: "Healthy", short: "Healthy" },
  { min: 3, max: 4, label: "Improvement opportunity", short: "Improvement" },
  { min: 5, max: 6, label: "High-risk leak", short: "High Risk" },
  { min: 7, max: 9, label: "Critical leak", short: "Critical" },
];

export const MAX_POINTS_PER_QUESTION = 3;
export const TOTAL_SCORED_QUESTIONS = DIAGNOSTIC_QUESTIONS.length; // 27
export const MAX_RISK_POINTS = TOTAL_SCORED_QUESTIONS * MAX_POINTS_PER_QUESTION; // 81
