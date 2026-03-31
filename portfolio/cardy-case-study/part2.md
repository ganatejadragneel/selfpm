# V0 PROMPT 2: Cardinality Case Study — Requirements 2 & 3 + Closing Sections

---

## CONTEXT

This is Prompt 2 of 2 for the Cardinality case study page. Prompt 1 already built the page hero, domain explainer, role section, and Requirement 1 (CTI) deep-dive.

**Continue building on the same page, directly below where Prompt 1 ended.** Use the exact same design system — colors, typography, spacing, component styles (Document Card, PM Moment Card, Expandable Section, Phase Stepper, Artifact Card) — established in Prompt 1.

The pattern for each requirement deep-dive is identical to Requirement 1:
1. Section header with label + H2 + subtitle
2. **The Starting Point** — Document Card showing the original FR requirement
3. **The Discovery (Gather)** — Narrative text + "Discovery Focus" summary card
4. **What I Built (Define)** — Artifact Card(s) + Expandable Acceptance Criteria
5. **What Changed (Validate)** — PM Moment Cards
6. **The Presentation** — Brief wrap-up

Follow this pattern exactly for Requirements 2 and 3 below.

---

## SECTION E: DEEP DIVE — REQUIREMENT 2: SAFETY & RISK ASSESSMENTS

### Section Header
White background section. Generous top padding (100px).

**Label (small, uppercase, muted, with colored left-border accent):**
```
DEEP DIVE — REQUIREMENT 2
```

**H2:**
```
Real-Time Safety & Risk Assessment Scoring
```

**Subtitle:**
```
When the client knows what outcomes they want — but can't articulate the rules — someone has to build the logic. That was me.
```

### Phase Stepper
Same horizontal 4-phase stepper as Requirement 1: **Gather → Define → Validate → Present**

---

### E1: The Starting Point

**Sub-label (small, muted):**
```
THE STARTING POINT
```

**Document Card (same style as Req 1):**

| ID | Type | Module | Requirement |
|----|------|--------|-------------|
| FR2.12 | Functional | Assessment | The System will calculate, if applicable, the Safety and Risk Assessment score/recommendation in real-time and update as report details are entered by the CWS Worker. The score/recommendation will be displayed at all times on the Assessment screen. |

**Below the card:**
```
Calculate a score. Show a recommendation. Sounds clear enough — until you ask how.
```

---

### E2: The Discovery (Gather Phase)

**Sub-label:**
```
PHASE 1 — GATHER
```

**Body text (exact copy to render):**

```
The first questions were easy. What are the inputs? The Child Safety Assessment, the Comprehensive Strength and Risk Assessment, the in-home safety plan. What are the outputs? A severity score and a recommended disposition — child removal, in-home safety plan, case closure, or referral for services. All fine.

Then the critical question: what are the rules? When exactly should the system recommend removal versus an in-home plan versus closure?

"We don't know. You figure it out."

That's the moment this requirement shifted from documentation to design. The business knew what outcomes they wanted but couldn't articulate the decision logic to get there. Case workers often aren't fully aware of how federal policy intends these assessment instruments to guide their recommendations — they operate on years of experience and professional judgment, not codified rules.

So I read the policy myself. I studied how the CSA and CSRA are meant to work together — which safety factors map to which severity levels, how risk indicators interact with allegation types, when strengths can offset risk and when they can't. Then I built a scoring matrix from scratch: conditions scored from 0 to 100, color-coded by severity, with specific recommended actions for every scenario.

They didn't hand me the rules. I created them and brought them back for validation.
```

**Discovery Focus card:**
```
Discovery Focus:
• Identifying required inputs (safety factors, risk indicators, family strengths) and expected outputs (severity + disposition)
• Transforming vague policy language into operational business logic
• Determining the precise conditions under which the system should recommend removal vs. in-home safety vs. case closure
• Reviewing child welfare policy governing CSA and CSRA usage — often more than the case workers themselves were familiar with
```

---

### E3: What I Built (Define Phase)

**Sub-label:**
```
PHASE 2 — DEFINE
```

**Intro text:**
```
With no existing rule set to work from, I built the decision matrix that governs how the system generates safety and risk recommendations. Every combination of conditions — safety factors, police custody, risk level, perpetrator relationship, allegation type — maps to a specific severity, score, recommended action, and visual indicator.
```

#### E3a: The Business Rules Matrix (Artifact Card)

Render as a large **Artifact Card** with a title bar.

**Artifact title:**
```
Safety & Risk Assessment — Business Rules Matrix
```

**Inside the card, render the following as a styled data table.** This is the actual decision logic I built. Use the same color scheme referenced in the "Color" column. The table should be horizontally scrollable on smaller screens.

**Table columns:** Condition | Police Custody | Safety | Risk | Perpetrator | Allegation | Severity | Recommended Action | Score | Color | Notes

**Table data (render all rows):**

Row 1:
- Condition: >1 Safety Factor
- Police Custody: Yes
- Safety: Yes
- Risk: Any
- Perpetrator: Household
- Allegation: Severe Harm / Child Death / Institutional Abuse / Unknown Perps / Trafficking
- Severity: Critical
- Recommended Action: CWS Crisis Response (+ Referral to HT Familial)
- Score: 100 / 100
- Color: Purple (render as a small purple dot/circle)
- Notes: Case created, referral also required in Case

Row 2:
- Condition: >1 Safety Factor
- Police Custody: Yes
- Safety: Yes
- Risk: Any
- Perpetrator: Non-Household
- Allegation: Severe Harm / Child Death / Institutional Abuse / Unknown Perps / Trafficking
- Severity: Critical
- Recommended Action: CWS Crisis Response (+ Referral to HT Non Familial)
- Score: 95 / 100
- Color: Purple
- Notes: Case created, referral also required in Case

Row 3:
- Condition: (blank)
- Police Custody: Yes
- Safety: Yes
- Risk: Any
- Perpetrator: Any
- Allegation: Severe Harm / Child Death / Institutional Abuse / Unknown Perps
- Severity: Critical
- Recommended Action: CWS Crisis Response
- Score: 90 / 100
- Color: Purple
- Notes: Case created

Row 4:
- Condition: >1 Safety Factor
- Police Custody: No
- Safety: Yes
- Risk: Any
- Perpetrator: Household
- Allegation: Trafficking
- Severity: High
- Recommended Action: CWS Assessment (+ Referral to HT Familial)
- Score: 85 / 100
- Color: Red
- Notes: Case created, referral also required in Case

Row 5:
- Condition: ≥1 Safety Factor
- Police Custody: No
- Safety: Yes
- Risk: Any
- Perpetrator: Non-Household
- Allegation: Trafficking
- Severity: High
- Recommended Action: CWS Assessment (+ Referral to HT Non Familial)
- Score: 80 / 100
- Color: Red
- Notes: Case created, referral also required in Case

Row 6:
- Condition: ≥1 Safety Factor
- Police Custody: No
- Safety: Yes
- Risk: Any
- Perpetrator: Any
- Allegation: Any except Severe Harm / Child Death / Trafficking / Institutional Abuse / Unknown Perps
- Severity: High
- Recommended Action: CWS Assessment
- Score: 75 / 100
- Color: Red
- Notes: Case created

Row 7:
- Condition: ≥1 Risk Factor
- Police Custody: No
- Safety: No
- Risk: High
- Perpetrator: Non-Household
- Allegation: Trafficking
- Severity: High
- Recommended Action: HT Non Familial
- Score: 70 / 100
- Color: Red
- Notes: No Case created, referral only

Row 8:
- Condition: ≥1 Risk Factor
- Police Custody: No
- Safety: No
- Risk: High
- Perpetrator: Any
- Allegation: Any except Severe Harm / Child Death / Trafficking / Institutional Abuse / Unknown Perps
- Severity: Moderate
- Recommended Action: VCM (Voluntary Case Management)
- Score: 60 / 100
- Color: Gold/Amber
- Notes: Case created, referral only

Row 9:
- Condition: ≥1 Risk Factor
- Police Custody: No
- Safety: No
- Risk: Moderate
- Perpetrator: Any
- Allegation: Any except Severe Harm / Child Death / Trafficking / Institutional Abuse / Unknown Perps
- Severity: Moderate
- Recommended Action: VCM (Voluntary Case Management)
- Score: 50 / 100
- Color: Gold/Amber
- Notes: Case created, referral only

Row 10:
- Condition: ≥1 Risk Factor
- Police Custody: No
- Safety: No
- Risk: Low
- Perpetrator: Any
- Allegation: Any except Severe Harm / Child Death / Trafficking / Institutional Abuse / Unknown Perps
- Severity: Low
- Recommended Action: FSS (Family Strengthening Services)
- Score: 30 / 100
- Color: Green
- Notes: No Case created, referral only

Row 11:
- Condition: ≥1 Risk Factor
- Police Custody: No
- Safety: No
- Risk: Family Strengths
- Perpetrator: Any
- Allegation: Any except Severe Harm / Child Death / Trafficking / Institutional Abuse / Unknown Perps
- Severity: Low
- Recommended Action: Registered Not Assigned
- Score: 0 / 100
- Color: Green
- Notes: No Case created

Row 12:
- Condition: ≥1 Risk Factor
- Police Custody: No
- Safety: No
- Risk: No
- Perpetrator: Any
- Allegation: Any except Severe Harm / Child Death / Trafficking / Institutional Abuse / Unknown Perps
- Severity: Low
- Recommended Action: Registered Not Assigned
- Score: 0 / 100
- Color: Green
- Notes: No Case created

Row 13:
- Condition: 0 Safety and 0 Risk Factors
- (all other columns follow same pattern)
- Severity: Low
- Recommended Action: Registered Not Assigned
- Score: 0 / 100
- Color: Green
- Notes: No Case created

**Footer row spanning full width:**
```
For all selections outside the above specified 12 criteria → Low severity → Registered Not Assigned → 0/100 → Green → No Case created
```

**Design notes for this table:**
- Color dots in the "Color" column should be actual colored circles: Purple (`#7c3aed`), Red (`#dc2626`), Gold/Amber (`#d97706`), Green (`#16a34a`)
- Alternating row backgrounds for readability
- Sticky first column and header row on horizontal scroll
- Consider allowing the table to be viewed in a modal/lightbox for full-screen viewing on smaller devices
- Below the table, a small note in muted text:

```
This matrix was built from federal policy, discovery sessions, and my own analysis. It did not exist before I created it.
```

---

### E4: What Changed (Validate Phase + PM Moment)

**Sub-label:**
```
PHASE 3 — VALIDATE
```

**Intro text:**
```
I validated every scenario in the matrix — each combination of safety factors, risk levels, and allegation types — confirming the system generated the correct score, severity, and recommendation. But the most significant contribution came from something I noticed outside the matrix itself.
```

#### PM Moment: The Federal Fields UX Redesign

Render as a **PM Moment Card** (amber left border, warm background):

**PM Moment label (small, amber):**
```
PM MOMENT
```

**Title (bold):**
```
Redesigning Federal Field Validation — Saving 20 Minutes Per Case
```

**Body (exact copy):**
```
During validation, I kept running into the same friction: before submitting any assessment, the system required dozens of federally mandated fields to be filled out — fields needed for AFCARS and NCANDS reporting. These fields are scattered across seven tabs of the assessment module. Many of them don't have answers at the assessment stage — they get collected later during case management or adoption. But federal rules require an entry, even if that entry is "Unknown."

In the previous system, there was no validation at all. Workers would submit, miss the federal fields entirely, and the state would get reprimanded by the federal government for incomplete data.

Our first improvement added validation: the system now blocked submission and listed which fields were missing. Better — but workers still had to navigate to each of the seven tabs, find the specific field, and mark it "Unknown" manually. This took roughly 20 minutes per case.

I built a better solution: a popup that appears at submission showing every missing federal field, with a checkbox next to each. Check the box, and the field is marked "Unknown" in the system — without ever leaving the popup. I also added a "Check All" button at the top for efficiency.

When I presented this to the client, they pushed back on "Check All." Their concern: a worker might genuinely have collected information for some of these fields but forgot to enter it. "Check All" would let them skip past fields they should have populated, and the system would never flag those fields again.

Fair point. I removed "Check All" but kept the individual checkboxes. The popup still saves workers from navigating seven tabs — roughly 20 minutes per case — while preserving the intentionality the client wanted: each field requires a conscious decision.

The tradeoff was right. Maximum efficiency would have meant less data quality. The client taught me where the line was, and I adjusted.
```

---

### E5: The Presentation

**Sub-label:**
```
PHASE 4 — PRESENT
```

**Body text:**
```
I demoed every scenario in the matrix live: a critical case with police custody and trafficking allegations pulling a score of 100 and a purple crisis response recommendation. A moderate-risk case triggering voluntary case management in gold. A low-risk case with family strengths registering green and closing without a case.

The team tested edge cases in real time. "What if there's one safety factor but no risk?" "What if it's trafficking but non-household?" Every combination resolved to a clear, defensible recommendation — because the matrix was exhaustive by design.

With sign-off secured, we invoiced the sprint.
```

---

## SECTION F: DEEP DIVE — REQUIREMENT 3: BACKGROUND CHECKS & EXTERNAL INTEGRATIONS

### Section Header
White background. Generous top padding.

**Label:**
```
DEEP DIVE — REQUIREMENT 3
```

**H2:**
```
Background Checks & External System Integrations
```

**Subtitle:**
```
How a single line about "state and federal databases" turned into interstate data-sharing agreements, four system integrations, and an alerting framework for stale records.
```

### Phase Stepper
Same 4-phase stepper: **Gather → Define → Validate → Present**

---

### F1: The Starting Point

**Sub-label:**
```
THE STARTING POINT
```

**Document Card:**

| ID | Type | Module | Requirement |
|----|------|--------|-------------|
| FR1.14 | Functional | Hotline Report / Intake | The System will be capable of automated searches and lookup of entered Intake report details in real-time. This may include, but is not limited to: a. Previous CWS Involvement (e.g., Child(ren), Parents, Alleged Perpetrator(s)) b. Background Checks (State and Federal databases, if available). |

**Below the card:**
```
"State and Federal databases." No system names. No data contracts. No specifics. Just a reference to entire government infrastructure.
```

---

### F2: The Discovery (Gather Phase)

**Sub-label:**
```
PHASE 1 — GATHER
```

**Body text (exact copy):**

```
First question: which databases, exactly? State CJIS, Federal CJIS, the Juvenile Justice Information System — those were expected. But then came the curveball.

Hawaii does significant kinship care placements with Nevada — specifically, families in Las Vegas. The state wanted to check Nevada's database too, because arrests and warrants sometimes exist in state-level systems but never surface in the federal CJIS. One requirement just became four integrations across two states and a federal system.

Next: what data do we actually need back? Arrests, temporary restraining orders, active warrants, misdemeanors, felonies — everything. What's the minimum input for accurate results? SSN, or Name + Gender + Date of Birth. Do they have Memoranda of Understanding in place to legally access all of this data?

"We don't know yet."

So now the path forward wasn't technical — it was legal and operational. We needed to document every data field we required, justify why we needed each one, establish MOUs with each agency, and only then build the integration.

And there was one more wrinkle: frequency. If background check data syncs nightly, what happens when a worker runs a check at 9am and new records appear at midnight? I designed an alert system — re-run all background checks requested that day once the nightly sync completes, and notify the worker if anything new surfaces. Because in child welfare, a 12-hour gap in criminal history data isn't an acceptable risk.
```

**Discovery Focus card:**
```
Discovery Focus:
• Identifying which state and federal systems are authoritative for background check data
• Discovering the Hawaii–Nevada kinship care pattern that required interstate integration
• Clarifying data types needed (arrests, TROs, warrants, convictions) and minimum match criteria (SSN or Name + DOB + Gender)
• Coordinating MOU requirements — legal prerequisites before any integration could begin
• Designing for non-real-time data: nightly syncs, re-checks, and worker alert systems
```

---

### F3: What I Built (Define Phase)

**Sub-label:**
```
PHASE 2 — DEFINE
```

**Intro text:**
```
The core interaction is simple: when a worker adds a person to the system, they can run a background check with a single click. The complexity lives in what happens behind that click — and what happens when the data isn't complete.
```

**Render the acceptance criteria directly (not in an expandable — this one is short enough to show):**

Render as a clean, structured card:

```
BACKGROUND CHECK — ACCEPTANCE CRITERIA

Trigger:
When a new person is added to the system, a "Run Background Check" button appears next to their name on the Person Demographic Screen.

On Click:
1. The system searches the person's Name, Gender, DOB (or SSN if available) across:
   • Hawaii State CJIS
   • Federal CJIS (if fingerprints available)
   • Nevada State CJIS
   • Juvenile Justice Information System (JJIS)

2. If Match Found:
   System returns: Name, Gender, DOB, SSN, Arrests, Temporary Restraining Orders, Active Warrants, Misdemeanors, Felonies
   (Full field list per CJIS MOU — to be appended once MOU is finalized)

3. If No Match:
   System returns: "No Match Found"

4. Results are displayed in a popup and saved to the "Background Check" page under Person360.

Nightly Re-Check:
All background checks requested during the day are re-run after the nightly data sync. If new records are found, the system sends an alert to the assigned worker.
```

**Below the acceptance criteria, a note in muted text:**
```
Visual artifact for this requirement is in progress — the integration architecture diagram will be added once MOU details are finalized with partner agencies.
```

---

### F4: What Changed (Validate Phase)

**Sub-label:**
```
PHASE 3 — VALIDATE
```

**Placeholder card** — render as a subtle card with a dashed border (indicating "coming soon"):

```
Validation and presentation details for this requirement will be added as integration testing completes with partner agencies. The MOU process with Nevada CJIS and Federal CJIS is currently in progress.
```

---

### F5: The Presentation

**Sub-label:**
```
PHASE 4 — PRESENT
```

Same placeholder treatment:

```
[Placeholder — to be added upon completion of integration testing and client demo]
```

---

## SECTION G: PRE-SALES CONTRIBUTIONS

### Section Header
Light gray background (`#f8fafc`).

**Label (small, uppercase, muted):**
```
BEYOND DELIVERY
```

**H2:**
```
Contributions to Pre-Sales
```

**Placeholder card (dashed border):**
```
[This section will detail contributions to the pre-sales process — including RFP response support, capability demonstrations, and competitive positioning. Content in progress.]
```

---

## SECTION H: KEY CHARACTERISTICS FOR BA SUCCESS

### Section Header
White background.

**H2:**
```
What Makes This Work
```

**Subtitle:**
```
Three characteristics I bring to every requirement — with evidence from the work above.
```

### Layout
Three cards in a row (stacks on mobile). Each card has:
- A trait name (large, bold)
- A one-line definition
- 2-3 bullet points connecting it to specific examples from the 3 requirements above

**Card 1:**
```
EMPATHY

Understanding the human reality behind every requirement.

• In CTI discovery, I didn't just document call flows — I understood that an intake worker answering a call about a child in danger needs instant access to history, language support, and the ability to escalate without friction.

• In the Assessment deep-dive, I recognized that case workers operate on experience and judgment, not codified rules — so I read the policy they were too busy to study and built the logic they needed.

• In Background Checks, I understood that a 12-hour data gap isn't a technical inconvenience — it's a child safety risk. That's why the nightly re-check and alert system exists.
```

**Card 2:**
```
CREATIVITY

Building what doesn't exist yet — not just documenting what does.

• The business rules matrix for Assessments didn't exist before I created it. The client couldn't articulate the rules, so I synthesized federal policy, discovery sessions, and my own analysis into a scoring engine.

• The N8N validation pipeline didn't exist before I built it. I turned a personal bottleneck into an automated system that classified and routed findings to the right people in minutes.

• The federal fields popup didn't exist in any version of the system. I saw friction in the user journey and designed a solution that saved 20 minutes per case while preserving data quality.
```

**Card 3:**
```
EXECUTION

Delivering at scale, on time, with precision.

• 1,400+ acceptance criteria written across 7 modules — each one specific enough for a developer to build without ambiguity.

• 6 sprints completed with 100% User Acceptance Testing pass rate — meaning every feature I specified met client expectations on first delivery.

• Personally responsible for the functional definition of a system that serves 550 users across 53 roles in Hawaii's Department of Human Services.
```

---

## SECTION I: PAGE CLOSER

### Layout
Light gray background. Centered text. Generous padding.

**Body text (centered, slightly larger than body — 1.125rem):**
```
This is one of three case studies in my portfolio. Each tells a different story about how I think about products — from enterprise systems to personal tools built from scratch.
```

**Two link cards side by side (or just text links):**

```
← SelfPM: Building a Product from Zero     NetsBrain: [Coming Soon] →
```

These are placeholder navigation links to the other case studies. Style them as subtle cards or simple text links with arrows.

---

## RESPONSIVE BEHAVIOR

Same rules as Prompt 1:
- **Desktop (1024px+):** Full layout. Business rules matrix has sticky headers. Key Characteristics cards in a 3-column row.
- **Tablet (768–1023px):** Business rules matrix scrolls horizontally. Cards go to 2-column where applicable.
- **Mobile (<768px):** Single column throughout. All tables scroll horizontally. Cards stack. Expandable sections default to collapsed.

---

## IMPORTANT NOTES FOR V0

1. **All text content above is EXACT COPY.** Do not paraphrase, reword, or shorten any body text, acceptance criteria, PM Moment stories, or card content. This is carefully written portfolio content.

2. **The business rules matrix (Section E3a) is the single most important visual artifact on this page.** It should look polished, professional, and data-rich. The color dots (Purple, Red, Gold, Green) are meaningful — they correspond to severity tiers. Make them visually distinct and clear.

3. **PM Moment Cards** continue to use the amber/gold accent (`#d97706` left border, `#fffbeb` background) established in Prompt 1. There is exactly ONE PM Moment in Requirement 2 (the federal fields story). Requirement 3 has no PM Moments yet (placeholder).

4. **Requirement 3 is intentionally thinner** than Requirements 1 and 2. The placeholder sections should feel clean and intentional — not broken or empty. Use a dashed-border card with muted text to signal "coming soon" rather than leaving blank space.

5. **The Key Characteristics section (H)** ties back to specific examples from the requirements above. This is intentional — it turns abstract traits into evidenced claims. Make sure the bullet points read naturally as references to prior content (the reader has already seen the work by this point).

6. **Maintain the same visual rhythm** as Prompt 1 — alternating white and light gray section backgrounds, consistent heading sizes, same component styles. This should feel like one continuous page, not two separate builds.

7. **The page closer (Section I)** should feel like a natural ending, not an abrupt stop. The navigation links to other case studies signal that there's more to explore without making this page feel incomplete.

8. **Total page length:** This is a long, detailed case study. That's intentional — the audience is someone seriously evaluating Kaushik's work, not casually browsing. Embrace the length but ensure every section earns its real estate through visual clarity and content density.
