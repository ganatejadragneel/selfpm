# V0 PROMPT 1: Cardinality Case Study — Page Setup + Domain + Role + Requirement 1 (CTI)

---

## PROJECT CONTEXT

Build a single-page case study for a portfolio website. This page showcases Kaushik Govindharajan's product work as a Lead Business Analyst on Hawaii's first Comprehensive Child Welfare Information System (CCWIS) — a $24M, federally funded state government project.

The page should feel:
- **Professional and serious** — this is government child welfare, not a startup. The stakes involve children's safety.
- **Clean, modern, spacious** — generous whitespace, no visual clutter
- **Confident but not flashy** — the work speaks for itself
- **Long-form scrollable** — the reader scrolls vertically through sections. This is a deep case study, not a landing page.

The page is one of three case study pages within a larger portfolio. Assume it will be navigated to from a parent portfolio page. Include a simple back-arrow or breadcrumb at the top (e.g., "← Back to Portfolio"), but do NOT build the parent page — just this case study page.

---

## DESIGN SYSTEM

### Colors
- **Background:** White (`#ffffff`) with very subtle light gray (`#f8fafc`) alternating section backgrounds for visual rhythm
- **Primary text:** Dark charcoal (`#0f172a`)
- **Secondary text:** Muted slate (`#64748b`)
- **Accent color:** Deep navy blue (`#1e3a5f`) — used for headings, the stat bar, and key UI elements
- **Highlight accent:** A warm amber/gold (`#d97706`) — used ONLY for "PM Moment" callout cards. This should feel like a distinct visual beat — something special, not overused.
- **Card backgrounds:** White with subtle border (`#e2e8f0`) and very light shadow
- **Code/data:** Slightly blue-tinted gray background (`#f1f5f9`)

### Typography
- **Headings (H1, H2):** Inter or system sans-serif, bold, tracking tight. H1 at 2.5rem, H2 at 1.75rem.
- **H3 (sub-section heads):** Inter semibold, 1.25rem
- **Body text:** Inter regular, 1rem, line-height 1.75 for readability
- **Data/numbers in stat bar:** Monospace font (JetBrains Mono or Fira Code), bold
- **Pull quotes:** 1.125rem, italic, with a left border accent
- **Labels/tags:** 0.75rem uppercase, letter-spacing wide, secondary color

### Spacing
- **Max content width:** 1100px centered (max-w-5xl equivalent)
- **Section vertical padding:** 80px top and bottom (generous breathing room between sections)
- **Card padding:** 24-32px internal
- **Between cards in a group:** 24px gap

### Components Used Across the Page
1. **Section Header** — H2 heading + optional subtitle paragraph. Left-aligned.
2. **Stat Card** — Monospace number on top (large, bold, navy), label below (small, muted). Used in the stat bar.
3. **Document Card** — Styled to look like a real document/table excerpt. Light background, thin border, monospace-ish text. Used to display the original FR requirement text.
4. **Artifact Card** — Larger card with border, used to display visual artifacts (flow diagrams, matrices). Has a subtle title bar at top.
5. **PM Moment Card** — Amber/gold left border (4px), warm amber tinted background (`#fffbeb`), with a small label "PM Moment" in amber at top. Contains a story about a decision or initiative that went beyond the job description.
6. **Phase Stepper** — A horizontal visual showing 4 phases (Gather → Define → Validate → Present) with the current phase highlighted. Used at the top of each requirement deep-dive.
7. **Expandable Section** — Click to expand/collapse. Used for detailed acceptance criteria and other dense content that should be available but not forced on every reader.

---

## PAGE STRUCTURE (Section by Section)

The page flows top-to-bottom in this order:

```
A. Page Hero (title + subtitle + stat bar)
B. The Domain (CCWIS explainer + 6 features + case lifecycle + funding)
C. My Role (description + 4-phase framework + module ownership)
D. Deep Dive: Requirement 1 — CTI
   D1. Starting Point (the original requirement)
   D2. The Discovery (gathering)
   D3. What I Built (definition — flow diagram + acceptance criteria)
   D4. What Changed (validation — PM Moments)
   D5. The Presentation

--- Prompt 2 will continue from here with Requirements 2, 3, and closing sections ---
```

---

## SECTION A: PAGE HERO

### Layout
Full-width section with the light gray background (`#f8fafc`). Content centered within max-width container. Vertically generous (100px top padding, 60px bottom before stat bar).

### Content

**Back link** (top left, small, muted):
```
← Back to Portfolio
```

**Title (H1):**
```
Product Work at Cardinality
```

**Subtitle (below title, muted text, max-width ~700px):**
```
Defining Hawaii's first Comprehensive Child Welfare Information System — a federally funded, state-wide platform that keeps children safe and families together.
```

**Role tag** (small label/tag below subtitle):
```
LEAD BUSINESS ANALYST · 2024–PRESENT
```

### Stat Bar
Below the title block, separated by 40px. A row of 6 stat cards, evenly spaced. On mobile, these wrap into a 2x3 or 3x2 grid.

| Number | Label |
|--------|-------|
| `$24M` | Contract Value |
| `550` | System Users |
| `53` | Distinct Roles |
| `7 / 13` | Modules Owned |
| `1,400+` | Acceptance Criteria |
| `100%` | User Acceptance (6 Sprints) |

Each stat card: number in large monospace bold navy, label in small muted text below.

---

## SECTION B: THE DOMAIN

### Section Header
White background section.

**H2:**
```
Understanding the System
```

**Subtitle paragraph:**
```
Before I can show you what I built, I need you to understand what I was building it for. Bear with me for a moment — by the time we're through, you'll understand child welfare from the highest view right down to individual requirements, and you'll see why precision and empathy aren't optional in this work.
```

### B1: What is a CCWIS? (Brief Definition Block)

A clean, left-aligned block of text. Not a card — just well-typeset body copy with key terms bold.

```
A Comprehensive Child Welfare Information System (CCWIS), introduced under federal regulation in 2016, is a state-wide system that supports the full lifecycle of child welfare operations — investigation, services, placements, court reporting, and funding eligibility — with a single mandate: keep children safe, and keep families together.

CCWIS replaced an older generation of child welfare systems by enforcing architectural discipline through funding incentives: the federal government contributes ongoing 50% funding toward any state's CCWIS build and maintenance, provided it meets all federal guidelines. This means every design decision we make carries regulatory weight.
```

The "50% funding" fact should be visually called out — render it as a small inline callout or highlighted aside:

**Callout card (compact, inline, subtle navy background, white text, single line):**
```
Federal Incentive: 50% ongoing funding for CCWIS systems that meet all federal guidelines.
```

### B2: Core Features of a CCWIS (Interactive Grid)

**Layout:** A 3-column grid (2 columns on tablet, 1 on mobile) of 6 feature cards. Each card shows:
- A **title** (bold)
- A small **icon** (monochrome, simple — can be a Lucide icon or similar)
- On hover (desktop) or on click (mobile), the card **expands or flips** to reveal the bullet-point details

Here are the 6 cards with their expand content:

**Card 1: Case Management**
Icon suggestion: Users or FileText
Expand content:
```
• Intake and hotline reporting
• Investigation and assessments
• Case plans and service referrals
• Placement tracking (foster/kinship)
• Ongoing case notes and documentation
```

**Card 2: Decision Support**
Icon suggestion: Brain or Lightbulb
Expand content:
```
• Safety and Risk Assessments
• Structured note-taking frameworks
• Alerts and action prompts for workers
```

**Card 3: Data Quality & Reporting**
Icon suggestion: BarChart3 or Database
Expand content:
```
• Federal reporting (AFCARS, NCANDS) — tied to funding compliance
• Immutable audit trails
• Data quality validation rules
```

**Card 4: Finance & Admin**
Icon suggestion: DollarSign or Calculator
Expand content:
```
• Provider payments
• Resource caregiver reimbursements
• Title IV-E eligibility determinations
```

**Card 5: Interoperability**
Icon suggestion: GitBranch or Link
Expand content:
```
• API integrations with SSA, CJIS, DoE
• Court system data exchange
• Batch and real-time API transfers
```

**Card 6: Modular Platform**
Icon suggestion: Blocks or Settings
Expand content:
```
• Page Designer (low-code form building)
• Workflow automation (n8n)
• Business Rules Engine (Drools)
• MicroStrategy reporting
• Role-based access control
```

### B3: Case Lifecycle (Serpentine Flow Diagram)

**Layout:** This should be a contained, visual flow diagram within a bordered section. Title at top. The diagram shows 17 steps in the lifecycle of a child welfare case.

**Section title:**
```
Child Welfare Case Lifecycle
```

**Section subtitle (muted):**
```
How a concern moves from first report to safe reunification
```

**Design:** A serpentine (zigzag) layout:
- Row 1: Steps 1–4, flowing left → right
- Row 2: Steps 5–8, flowing right → left
- Row 3: Steps 9–12, flowing left → right
- Row 4: Steps 13–17, flowing right → left

Each step is a **rounded rectangle card** containing:
- Step number (small, muted, top-left)
- **Step title** (bold, slightly larger)
- Short narrative text (smaller, muted, 2-3 lines max)
- Subtle connecting arrows between steps

**Constraints:**
- Cards should be equal width within their row
- Keep it compact — this is context-setting, not the centerpiece
- Muted colors, thin borders, no heavy shadows
- On mobile, this collapses to a single-column vertical flow with arrows between cards
- Consider making this section scrollable horizontally on smaller screens, OR collapse all into a vertical flow

**The 17 Steps (exact content):**

1. **Report of Concern**
"A teacher notices bruises on a child for the third time. Something doesn't feel right. They call the hotline."

2. **Intake**
"An intake worker gathers details: When did this happen? Who lives in the home? What exactly are you seeing?"

3. **Intake Disposition**
"There may be ongoing abuse and immediate safety concerns. This is escalated for further assessment."

4. **Case Assignment**
"The family speaks Mandarin and lives locally. The system recommends a worker who matches language, location, and availability."

5. **Initial Contact — Child**
"A worker visits the child. 'You're not in trouble. I'm here to make sure you're okay. Can you tell me what's been happening?'"

6. **Initial Contact — Family**
"'We received a report. We want to understand what's going on. Is everyone safe right now?'"

7. **Assessment & Disposition**
"Based on safety and risk factors, the child cannot safely remain in the home right now."
_(Secondary line, lighter text:)_ "System-generated risk scores support — but do not replace — professional judgment."

8. **Protective Custody**
"Temporary custody is taken to ensure immediate safety. This is a protective step while next actions are determined."

9. **Court Petition Filed**
"The agency requests court authorization to formally remove the child due to documented safety concerns."

10. **Family Case Plan**
"A plan outlines what must happen — treatment, services, behavior changes — for safe reunification."

11. **Service Referrals**
"The family is connected to counseling, substance treatment, job support, and parenting programs."

12. **Ongoing Monitoring**
"Workers check regularly: Are services being completed? Is risk decreasing? Are new concerns emerging?"

13. **Placement Options**
"The best placement is sought — starting with relatives, then licensed foster caregivers, then group settings."

14. **Visitation & Well-Being**
"The child visits family while the agency monitors emotional and physical well-being."

15. **Caregiver Payments**
"Foster caregivers are compensated for daily care and reimbursed for essential expenses like clothing and school supplies."

16. **Court Review**
"Based on progress and safety assessments, the agency makes a recommendation to the court."

17. **Reunification**
"The child safely returns home. Monitoring continues to ensure lasting stability."

### B4: Transition Text

After the lifecycle diagram, a brief paragraph (body text, slightly larger, maybe 1.05rem):

```
Thank you for indulging that overview — you're now broadly up to speed on the domain I work in. I felt it important that you understand the seriousness of the circumstances this system supports before I show you my specific contributions. I hope this adds a lens of timeliness, precision, and purpose to everything that follows.
```

---

## SECTION C: MY ROLE

### Layout
Light gray background (`#f8fafc`) section.

### Section Header

**H2:**
```
My Role
```

**Body text (max-width ~750px):**
```
For Hawaii's first-ever CCWIS — replacing a legacy system that has served the state for decades — I am one of two Lead Business Analysts. I own 7 of the system's 13 functional modules, including Intake, Investigation, Assessment, External Integrations, and Reporting.

My accountability is simple: Can the client use our system to meet their business needs today, and will the architecture hold for the next ten years?
```

### C1: The 4-Phase Framework

A **horizontal pipeline visual** — 4 connected stages, left to right, with an arrow or connector between each. Each stage is a rounded box with:
- Phase name (bold, larger)
- Key trait in parentheses (muted, smaller)
- One-line description below

```
[  GATHER  ]  →  [  DEFINE  ]  →  [  VALIDATE  ]  →  [  PRESENT  ]
 (Empathy)       (Precision)      (Rigor)           (Charisma)
```

Below the pipeline, a brief explanation paragraph:

```
The state provides high-level requirements guided by federal regulation. My job is to take those requirements — often a single sentence — and turn them into something a development team can build without ambiguity.

Gather: I facilitate structured discovery sessions, ask leading questions, and surface the real-world complexity hiding beneath one-line requirements. Define: I write detailed acceptance criteria, build workflow diagrams, and create the business logic — in no uncertain terms. Validate: I test every scenario end-to-end and identify what we missed. Present: I demo to stakeholders, address feedback, secure sign-off, and invoice the sprint.
```

On mobile, the 4 phases stack vertically.

### C2: Transition into Deep Dives

**Body text:**
```
Below are three requirements I delivered, each demonstrating a different type of complexity. For each, I'll show you what I started with, what I uncovered, what I built, and what changed along the way.
```

---

## SECTION D: DEEP DIVE — REQUIREMENT 1: COMPUTER TELEPHONY INTEGRATION (CTI)

This is the first (and in this prompt, only) requirement deep-dive. It should feel like a substantial, well-structured mini-case-study within the page. The visual pattern established here will repeat for Requirements 2 and 3 in Prompt 2.

### Section Header
White background section. Generous top padding (100px) to signal a new major section.

**Label (small, uppercase, muted, with a colored left-border accent):**
```
DEEP DIVE — REQUIREMENT 1
```

**H2:**
```
Computer Telephony Integration (CTI)
```

**Subtitle:**
```
From a one-line RFP item to a full telephony workflow serving 550 users across Hawaii's Child Welfare Services.
```

### Phase Stepper (Visual)
Below the subtitle, show a small horizontal phase stepper — 4 dots or boxes connected by lines, labeled: **Gather → Define → Validate → Present**. As the reader scrolls through sub-sections, the active phase highlights (or just show all 4 statically — both work).

---

### D1: The Starting Point

**Sub-label (small, muted):**
```
THE STARTING POINT
```

Render the original functional requirement as a **Document Card** — styled to look like an excerpt from a requirements table/spreadsheet. Light gray background, thin border, slightly monospace feel.

**Document Card content (render as a small table):**

| ID | Type | Module | Requirement |
|----|------|--------|-------------|
| FR1.2 | Functional | Hotline Report / Intake | The System will be capable of automated searches for previous CWS history / involvement tied to an incoming residential caller's phone number, using CTI. |

Below the document card, a single line of body text:

```
One sentence. That's what we received in the RFP. Here's what it actually took to build.
```

---

### D2: The Discovery (Gather Phase)

**Sub-label:**
```
PHASE 1 — GATHER
```

**Body text (this is the rewritten gather — exact copy to render):**

```
The first question was straightforward: what information do intake workers actually need to see when a call comes in? Name, case number, role in previous cases, case status, date of birth — we gave recommendations, they confirmed and adjusted.

Then it got interesting. "Do you have an existing CTI system?" Yes — WebEx. "But we're moving away from it." They were migrating to an AWS infrastructure, and WebEx wasn't compatible. So now this requirement wasn't just about caller lookup — it was a full platform migration to Amazon Connect, and we needed to design the entire call workflow from scratch.

That's when the real complexity surfaced. Law enforcement callers need to skip the queue entirely. The system supports six languages — English, Spanish, Tagalog, Ilocano, Visayan, and Chuukese — each requiring interpreter routing. During business hours (Mon–Fri, 7:45am–4:30pm), calls route to online intake workers. After hours, they go to on-call CWS staff or a third-party provider called Physician's Exchange, managed on a monthly rotation calendar. Operators can mark themselves offline in HI THRIVE to opt out of routing. And if nobody picks up? The caller needs options — callback, voicemail, or stay on hold.

One line in an RFP. An entire telephony system underneath it.
```

**Below the body text, a compact summary card titled "Discovery Focus":**

Render as a simple card with 4 bullet points:
```
Discovery Focus:
• What caller context is actually useful to intake workers during a live call
• How call behavior changes between business and after-hours
• How priority (law enforcement) and language affect routing decisions
• Constraints of the current platform (WebEx) and the target platform (AWS/Amazon Connect)
```

---

### D3: What I Built (Define Phase)

**Sub-label:**
```
PHASE 2 — DEFINE
```

**Intro text:**
```
Once I understood the full scope, I needed to define it so our development team could build it — in no uncertain terms. I produced two artifacts: a complete call flow diagram and a set of detailed acceptance criteria covering every scenario.
```

#### D3a: The Flow Diagram (Artifact Card)

Render this as a large **Artifact Card** — a bordered container with a title bar.

**Artifact title:**
```
CTI Workflow for Incoming Calls to DHS
```

**Inside the card, build a visual flow diagram as a React component.** This should be a clean, readable flowchart showing the call routing logic. Here is the exact flow to render:

**Flow structure:**

```
[Incoming Call]
    ↓
[System Message: "Thank you for calling CWS. Press 1 if you are with Law Enforcement; otherwise, press any other key."]
    ↓ (splits into two paths)

PATH A: Law Enforcement (Press 1)
→ Marked as Priority → Routed to operators with priority flag

PATH B: All Other Callers
    ↓
[Language Selection: "Press 1 for English, 2 for Spanish, 3 for Tagalog, 4 for Ilocano, 5 for Visayan, 6 for Chuukese"]
    ↓
[Decision: Is call within CWS business hours? (Mon–Fri, 7:45am – 4:30pm)]
    ↓ YES                          ↓ NO
[Online Intake Worker Queue]    [On-Call CWS Staff / Physician's Exchange Queue]
    ↓___________________________↓
              ↓
    [Decision: Does operator answer?]
        ↓ YES                   ↓ NO
    [Call bridges to           [System Message: "Press 1 for callback,
     operator. Operator         2 for voicemail, or remain on hold."]
     can transfer, merge,          ↓
     put on hold]              [Callback → capture number → end call]
        ↓                      [Voicemail → record → end call]
    [Decision: Transfer        [Hold → return to queue → end after 15min]
     needed?]
     YES → Transfer/Merge
     NO → End Call
```

Render this as a proper visual flowchart — use rounded rectangles for process steps, diamonds for decisions, cloud/oval shapes for system messages. Color-code decision points in a slightly different shade. Keep it clean and readable — not cramped.

**Below the flow diagram, add a Notes section inside the same Artifact Card:**
```
Notes:
1. CWS Working Hours: 7:45am – 4:30pm, Mon–Fri
2. Operators can set status to "Offline" in HI THRIVE to be excluded from routing
3. On-Call / Physician's Exchange routing follows a monthly schedule, adjustable by supervisor
4. Workers can transfer or merge calls via quick-contacts or dial pad
5. Caller priority (Law Enforcement) and language selection are visible to the operator on answer
6. All call events are logged with timestamp and user for audit
7. Law Enforcement identification step can be skipped if caller's number is in the known LE directory
```

#### D3b: Acceptance Criteria (Expandable Section)

Below the flow diagram artifact, add an **Expandable Section** (collapsed by default, click to expand).

**Expandable header:**
```
▶ View Full Acceptance Criteria (click to expand)
```

**Expanded content — render as structured text with clear sub-headers:**

```
CALLER PRIORITY PROMPT
1. Upon call connect, the system plays: "Thank you for calling CWS. Press 1 if you are with Law Enforcement; otherwise, press any other key."
2. If "1" is pressed, the call is marked as Law Enforcement priority.

LANGUAGE SELECTION PROMPT
1. After priority selection, the system plays: "Press 1 for English, 2 for Spanish, 3 for Tagalog, 4 for Ilocano, 5 for Visayan, 6 for Chuukese."
2. The system tags the call with the selected language.

BUSINESS-HOURS ROUTING
1. The system checks current day/time against the CWS schedule (Mon–Fri, 7:45am–4:30pm).
2. Within hours → route to Online Intake Worker queue.
3. Outside hours → route to On-Call CWS Staff / Physician's Exchange queue per monthly calendar.

OPERATOR AVAILABILITY
1. Operators who set status to "Offline" in HI THRIVE are excluded from queue routing.
2. When an operator answers, the call bridges to them.
3. During the call, the operator can:
   • Transfer or merge the call via quick-contact list or dial pad
   • Choose hot transfer (disconnect self) or cold merge (stay on call)

NO-ANSWER HANDLING
1. If no operator answers within the queue timeout, the system plays: "Press 1 for callback, 2 for voicemail, or remain on hold."
2. Callback → capture number, end call with "We will call you shortly."
3. Voicemail → record message, end call.
4. Hold → return to queue, end call after 15-minute wait if still unanswered.

OPERATOR ACTIONS ON ANSWER
1. Operator views live call details: phone number, duration, priority, language.
2. Operator can hold, transfer, or merge the call.
3. Operator can make outbound calls via soft phone dial pad or quick contacts.

AUDIT & LOGGING
1. Every call event — priority selection, language, operator answer/no-answer, hold time, transfer, callback, voicemail — is logged with timestamp and user ID.
```

---

### D4: What Changed (Validate Phase + PM Moments)

**Sub-label:**
```
PHASE 3 — VALIDATE
```

**Intro text:**
```
Validation wasn't just confirming the system worked — it was where I caught what we missed, and where some of my best contributions came from. Two examples:
```

#### PM Moment 1: Language Menu Ordering

Render as a **PM Moment Card** (amber left border, warm background):

**PM Moment label (small, amber):**
```
PM MOMENT
```

**Title (bold):**
```
Reordering the Language Menu by Call Volume
```

**Body:**
```
While validating the IVR flow, I realized the language selection menu had languages listed in an arbitrary order. A caller who needs Spanish — likely the second most common language — might have to listen through several options before hearing theirs.

I recommended ordering the language options by historical call volume, so the most frequently requested languages appear first. This reduces average wait time across all callers — a small optimization, but one that compounds across thousands of calls per year.

I requested historical call volume data from the state team, and once received, we reordered the IVR menu accordingly.
```

#### PM Moment 2: The N8N Validation Pipeline

Render as a second **PM Moment Card:**

**PM Moment label:**
```
PM MOMENT
```

**Title:**
```
Building an Automated Pipeline to Process Validation Findings
```

**Body:**
```
During CTI validation, I was discovering issues faster than I could document them — bugs, enhancement ideas, questions for my team, questions for the state. I was recording my validation sessions, but turning recordings into organized action items was eating hours of my week.

So I built a pipeline. Using N8N (our workflow automation tool) and the Google Meet transcription feature, I created an automated system that:

1. Takes the transcript from a recorded validation session
2. Parses it using keyword flags I tag during the session (e.g., "team question," "state question," "bug," "enhancement")
3. Classifies each finding and routes it to the correct audience
4. Generates two separate Excel sheets — one for my development team, one for the state — with context and classification
5. Emails each sheet to the respective recipients automatically

This cut my validation overhead by approximately 50%. Instead of spending hours writing up findings after each session, I got organized, classified deliverables within minutes of ending the call.
```

---

### D5: The Presentation

**Sub-label:**
```
PHASE 4 — PRESENT
```

**Body text:**
```
With validation complete, I presented the full CTI workflow to the Intake team — the workers who would use this system every day.

The demo walked through every path: law enforcement priority routing, each language selection, business-hours vs. after-hours queue behavior, what happens when no one picks up. I showed them how simple it was to add contacts for one-click transfers, how to merge calls to bring supervisors in, and how to access call logs with all recorded metadata.

The goal wasn't just sign-off — it was confidence. These workers handle calls about children in danger. They need to trust that the system won't drop a call, misroute a language, or lose a voicemail. By the time the demo was over, they did.
```

---

## SECTION DIVIDER

After Requirement 1 ends, add a subtle visual divider — a thin line or extra whitespace — and a small text note:

```
Requirements 2 and 3 continue below.
```

_(This is where Prompt 2 picks up.)_

---

## RESPONSIVE BEHAVIOR

- **Desktop (1024px+):** Full layout as described. 3-column grids, horizontal pipeline, side-by-side elements where specified.
- **Tablet (768–1023px):** 2-column grids, pipeline remains horizontal but more compact. Flow diagram may need horizontal scroll.
- **Mobile (<768px):** Single column. Stat bar wraps to 2x3 grid. Pipeline stacks vertically. Lifecycle diagram becomes a vertical flow. Flow diagram artifact scrolls horizontally within its card. Expandable sections default to collapsed.

---

## IMPORTANT NOTES FOR V0

1. **All text content above is EXACT COPY.** Render it as written. Do not paraphrase, summarize, or rephrase any of the body text, stat numbers, acceptance criteria, or PM Moment stories. This is portfolio content that has been carefully written.

2. **The flow diagram in section D3a should be built as a React component**, not an image. Use SVG or a library like reactflow if helpful, but a clean CSS/flexbox-based layout with arrows also works. The key is readability and visual clarity.

3. **Hover interactions on the CCWIS feature grid (B2):** On desktop, cards expand on hover to reveal bullet points. On mobile, cards expand on tap. Consider a flip-card effect or a simple accordion expand.

4. **The PM Moment cards should feel visually distinct** from everything else on the page. They are the moments that separate "I did my job" from "I went beyond my job." The amber accent achieves this — use it only here.

5. **The Case Lifecycle section (B3) should be contained and compact.** It's context-setting, not the centerpiece. Consider a scrollable container with a fixed height, or just ensure it doesn't dominate the page. The deep-dive requirements are the real content.

6. **Smooth scroll behavior** throughout the page. If you add any anchor links or a sticky sidebar nav, use smooth scrolling.

7. **Do not add a footer, navigation bar, or any elements beyond what's described.** This page lives within a larger portfolio shell that will be built separately.
