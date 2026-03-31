# SelfPM: Product Perspective
## How the System Was Built to Enable Discovery

*A companion to the Case Study—focusing on product decisions, feature rationale, and the design thinking behind the platform.*

---

# The Product Skills Demonstrated

This document maps the **product thinking** behind SelfPM—showing how each feature decision enabled the insights documented in the case study.

| Skill Area | How It's Demonstrated |
|------------|----------------------|
| Problem Discovery | Let data reveal Identity Pressure; didn't assume the problem |
| Platform Thinking | Built flexible infrastructure, not rigid solutions |
| Instrumentation Design | Created checkpoints to measure previously invisible states |
| Qual + Quant Integration | 600-char notes attached to every metric |
| Build-Measure-Learn | 4 → 19 metrics in 90 days; feature iteration from friction |
| Self-as-User Honesty | Documented failures with same rigor as successes |
| LLM-Native Analysis | Structured data for Claude pattern extraction |

---

# Part 1: Platform Architecture Decisions

## 1.1 The Flexible Metric System

**The Decision**: Build a system where users can create custom habits with different input types, rather than pre-defining what to track.

**Implementation**:
```
Three input types:
├── Boolean (Yes/No) — Simple completion tracking
├── Dropdown (Categorical) — Multiple choice options
└── Custom Options — User-defined dropdown values
```

**Why This Matters**:

When I started, I only knew I wanted to track 4 things. But as my understanding evolved, I needed to track things I couldn't have predicted:
- "Identity Pressure (10am)" — a 4-option dropdown I invented on Nov 11
- "Body State on Waking" — ordinal scale from "Tense/Anxious" to "Soft/Relaxed"
- "Urge Response" — tracking *what I did* when urges arose, not just whether I resisted

**The Product Insight**:

If I had built a rigid "habit tracker" with predefined categories, I would have been stuck tracking *behaviors* forever. The flexible architecture let me evolve from tracking **what I did** to tracking **how I felt**—which is where the real insights lived.

> **Feature → Insight Chain**: Custom metric creation → ability to add "Identity Pressure" as a metric → discovery that IP is the master variable → entire framework emerges

---

## 1.2 The 600-Character Contextual Notes

**The Decision**: Attach a substantial text field to every metric entry, every day.

**Evolution**:
- Originally 200 characters (felt restrictive)
- Expanded to 600 characters in late November based on usage friction
- Added voice input (Web Speech API) for faster capture

**Why This Matters**:

The notes aren't journaling—they're **structured qualitative data**. Each note is:
- Attached to a specific metric (context)
- Dated (temporal anchoring)
- Exportable as JSON (machine-readable)

This structure enabled the CPO analysis. Claude could correlate what I wrote on high-Identity-Pressure days vs. low-IP days and surface patterns I couldn't see.

**Example of Note → Pattern Discovery**:

On Nov 19, I wrote in my "Craving Intensity" note:
> "Very high today in the early afternoon. I caved, twice. I thought it was IP... but also, fatigue. I am SO fatigued from long workouts and less sleep..."

This note led to a key insight captured in "Did I Learn Today?":
> "Differentiate between identity pressure and fatigue. Not everything is IP. Feel your body. Am I feeling pressure, or am I just tired?"

**The Product Insight**:

Notes transform a habit tracker into a **self-research platform**. The combination of structured metrics + unstructured notes creates a dataset rich enough for pattern analysis.

---

## 1.3 The Data Export Feature

**The Decision**: One-click JSON export of all data—tasks, completions, notes, metadata.

**Why I Built It**:

I needed to get my data *out* of the app and into Claude for analysis. The built-in analytics could show me completion rates, but couldn't answer questions like:
- "What predicts high Identity Pressure days?"
- "Which morning activities correlate with successful urge surfing?"
- "What patterns precede a cascade failure?"

**The Export Structure**:
```json
{
  "customTasks": [...],      // Metric definitions
  "completions": [...],      // Daily completion records
  "notes": [...]             // Contextual notes with dates
}
```

**The Product Insight**:

**Design for analysis, not just display.** The export feature is what made the CPO analysis possible. Without it, my data would be trapped in the UI, visible but not queryable.

> **The LLM-Native Design Principle**: Structure your data so it can be fed to an LLM for pattern extraction. This is the real unlock—human-entered data + machine analysis.

---

## 1.4 Multiple Checkpoints Per Day

**The Decision**: Track the same dimensions at multiple times throughout the day.

**Implementation**:
- Body State on Waking (morning calibration)
- Identity Pressure at 10am (after morning routine window)
- 2pm Body Check-In (mid-day state)
- Evening Body Check-In (end-of-day state)
- Overall Day Quality at 8pm (retrospective rating)

**Why This Matters**:

A single daily check-in would tell me if a day was "good" or "bad." Multiple checkpoints reveal the **trajectory**—how I moved from morning to evening, where things went wrong, what interventions worked.

**Example of Checkpoint → Insight**:

Comparing "Body State on Waking" to "Identity Pressure (10am)" revealed:
- When morning body state was "Soft/Relaxed" → IP stayed Low 78% of the time
- When morning body state was "Tense/Anxious" → IP was Medium or higher 67% of the time
- BUT: Completing morning Jabam + Reading before 10am reduced IP regardless of waking state

**The Product Insight**:

**Longitudinal micro-measurements reveal intervention opportunities.** Single daily measurements show correlation; multiple checkpoints show causation and timing.

---

# Part 2: Feature Evolution Through Usage

## 2.1 The Metric Expansion Timeline

| Date | Metrics Added | What I Learned That Prompted It |
|------|---------------|--------------------------------|
| Sep 2 | Jabam (M), Jabam (E), Exercise, Don't smoke weed | Starting point—tracking behaviors |
| Nov 9 | Read 10 pages | Realized reading primed my cognition for the day |
| Nov 11 | Sleep Quality, Body State on Waking, Identity Pressure, 2pm Body Check, Craving Intensity, Urge Response, Day Quality, Evening Body Check | **The big expansion**—shifted from behaviors to internal states after 70-day analysis |
| Nov 13 | Visualization | MCC practice needed tracking |
| Nov 17 | Did I Learn Anything Today? | Wanted to capture meta-insights |
| Nov 21 | Wins for the Day | Needed to track positive anchors, not just problems |
| Nov 28 | Cricket on My Mind | Domain-specific tracking for a personal goal |
| Nov 30 | Wedding Vibes, Learning about Money | Expanded to life domains beyond self-regulation |

**The Pattern**:

Each expansion came from a specific learning moment—not theoretical planning. The Nov 11 expansion came directly from the first CPO analysis, which revealed I was tracking *outputs* (behaviors) without measuring *inputs* (internal states).

**The Product Insight**:

**Let usage drive feature development.** I didn't plan 19 metrics on day 1. I started with 4, used the system, analyzed the data, and added metrics when I discovered blind spots.

---

## 2.2 The Voice Input Addition

**The Friction**: Typing 600 characters on mobile was slow. I'd skip notes when rushed.

**The Solution**: Integrated Web Speech API for voice-to-text in note fields.

**The Impact**: Note completion increased, especially for morning entries when I was still waking up.

**The Product Insight**:

**Reduce friction at the moment of capture.** The best data comes from real-time entry, not end-of-day recall. Voice input lowered the barrier to capturing thoughts in the moment.

---

## 2.3 The Character Limit Expansion

**The Friction**: 200 characters forced truncation. I was cutting off insights mid-sentence.

**The Decision**: Expanded to 600 characters.

**The Tradeoff Considered**: Longer notes = more effort = potential abandonment. But the notes are optional—the checkbox completion is what matters for streaks. Notes are for depth when you have it.

**The Product Insight**:

**Don't constrain the power users.** The character limit should accommodate the days when insight is flowing, not force brevity. Those rich entries are where the patterns hide.

---

# Part 3: Analysis Methodology

## 3.1 The CPO Report Process

**The Workflow**:
1. Export JSON from SelfPM settings
2. Upload to Claude conversation
3. Prompt with specific analysis questions
4. Receive pattern analysis
5. Save insights to project repo
6. Adjust metrics/protocols based on findings

**Example Prompt Structure**:
```
Here is my habit tracking data from the past 3 weeks.

Analyze:
1. What predicts high Identity Pressure days?
2. Which morning activities correlate with successful urge navigation?
3. What patterns precede cascade failures?
4. What's working that I should double down on?
5. What's not working that I should adjust?

Be specific. Quote my notes when relevant.
```

**What Made This Work**:
- Structured JSON export (not screenshots or summaries)
- Temporal metadata (dates on everything)
- Qualitative notes attached to quantitative metrics
- Consistent daily entries (enough data for patterns)

**The Product Insight**:

**Design your data for LLM consumption.** The export format, the note structure, the metadata—all of it was designed knowing that Claude would be the analyst. This is LLM-native product design.

---

## 3.2 Pattern Extraction Examples

**Pattern 1: The First Wave Theory**

*How it was discovered*:

Claude correlated "Urge Response" values across days and found:
- Days where first urge = "Breathed through" → subsequent urges mostly surfed
- Days where first urge = "Used" → average 3.4 additional releases

*The note that confirmed it*:
> **Nov 25, 2025**: "Its just the most crucial thing in the world... to surf the first urge of the day and not relent to it. Its a very slippery slope."

**Pattern 2: The Morning Routine Buffer**

*How it was discovered*:

Claude compared days with complete morning routine (Jabam + Reading + MCC) vs. incomplete:
- Complete: 85% task completion, 7.8/10 day quality, low craving intensity
- Incomplete: 45% task completion, 4.2/10 day quality, high craving intensity

*The note that confirmed it*:
> **Nov 29, 2025**: "Great sleep (7+hours) and Morning routines really are the KEY to setting myself up for the day."

**Pattern 3: The Definition of Done Problem**

*How it was discovered*:

Claude noticed that Identity Pressure remained elevated even after "completing" certain tasks. The notes revealed why:

> **Nov 17, 2025**: "I don't have a 'definition of done' for the tasks I do. This is it. I actually don't know when I've finished a task."

*The product response*:

Created the MCC (Morning Command Center) protocol, which includes explicit "Definition of Done" for each day's tasks.

**The Product Insight**:

**Combine quantitative patterns with qualitative explanation.** Claude found the correlation; my notes explained the mechanism. Neither alone would have been sufficient.

---

# Part 4: The Platform Thinking Demonstration

## 4.1 From Personal Tool to Generalizable Platform

SelfPM wasn't designed as "a cannabis cessation app" or "a meditation tracker." It was designed as **infrastructure for self-measurement**.

**Evidence of Platform Thinking**:

The same system that helps me track "Identity Pressure" could help someone else track:
- Blood sugar correlations with mood
- Caffeine intake vs. sleep quality
- Work stress vs. relationship quality
- Any personal hypothesis about their own patterns

**The Flexible Primitives**:
- Custom boolean metrics (any yes/no behavior)
- Custom dropdown metrics (any categorical state)
- Contextual notes (any qualitative observation)
- Temporal checkpoints (any time-based measurement)
- Data export (any external analysis)

**The Product Insight**:

**Build primitives, not prescriptions.** Instead of telling users what to track, I built tools that let anyone design their own self-study. This is the difference between a product and a platform.

---

## 4.2 The Self-Research Infrastructure

SelfPM is really a **personal research platform** disguised as a habit tracker.

**The Research Capabilities**:

| Capability | How It's Implemented |
|------------|---------------------|
| Hypothesis formation | Custom metric creation |
| Data collection | Daily completion logging + notes |
| Longitudinal tracking | Date-stamped entries over time |
| Qualitative depth | 600-char contextual notes |
| Pattern analysis | JSON export → Claude analysis |
| Intervention testing | Add new metrics, observe changes |
| Documentation | Notes become research journal |

**Example: Testing the MCC Hypothesis**

*Hypothesis*: Morning visualization (MCC) reduces Identity Pressure.

*Method*:
1. Added "Visualization" metric on Nov 13
2. Tracked daily completion
3. Correlated with Identity Pressure (10am) metric
4. Analyzed via CPO report

*Finding*: Days with MCC → 65% lower IP at 10am. Hypothesis confirmed.

*Refinement*: Discovered MCC quality matters—rushed MCC didn't help.

> **Nov 19, 2025**: "I need to make it more effective. Today is an example of slightly ineffective visualization. I did it almost for name sake... focus when you do it!"

**The Product Insight**:

**Enable users to run experiments on themselves.** The best behavior change comes from personal discovery, not prescribed protocols. SelfPM provides the infrastructure for that discovery.

---

# Part 5: Honest Self-as-User Documentation

## 5.1 Documenting Failures with the Same Rigor as Successes

One of the hardest aspects of self-research is **acknowledging reality**.

**Examples of Honest Failure Documentation**:

> **Dec 2, 2025**: "I did not do any of the mitigating factors, and rushed to use today. Both sexual release, as well as smoking up, then eating unhealthy outside, and spending money, and snacking on sweets. The whole 9 yards. I really let my urge win me today."

> **Dec 2, 2025**: "Oops. smoked up, multiple times today. bought a medical card and everything. i feel so bad, and foolish about this."

> **Nov 25, 2025**: "I caved to my first urge around 8am, and it was ALL downhill from there. I am not too happy about this. I didn't execute all of my knowledge and learnings on how to mitigate this."

**Why This Matters for Product**:

These entries aren't just personal venting—they're **calibration data**. Each failure teaches me:
- What conditions preceded the failure
- Which interventions I skipped
- What the cascade pattern looked like
- How long recovery took

**The Product Insight**:

**Create psychological safety for honest data.** SelfPM is private. There's no social sharing, no streaks that shame me, no judgment. This safety enables the honesty that makes the data useful.

---

## 5.2 The Recovery Metric

One metric I track implicitly: **recovery time**.

| Slip Event | Pre-SelfPM Recovery | With-SelfPM Recovery |
|------------|--------------------|--------------------|
| Cannabis relapse | 5-7 days of continued use | 36 hours back to routine |
| Cascade failure | Week-long spiral | Next-day reset |
| Missed morning routine | Day feels "lost" | Partial recovery by afternoon |

**How Recovery Improved**:

The framework doesn't prevent all failures—it prevents **extended failures**. The awareness built through tracking means I can:
1. Recognize the slip quickly
2. Document without shame
3. Identify the vulnerability
4. Re-commit to anchor tasks
5. Resume the next day

> **Nov 28, 2025**: "I have planned out my day well, based on the latest CPO report from last night. I have re-prioritized my anchor items..."

**The Product Insight**:

**Optimize for recovery, not perfection.** A system that demands perfect streaks will be abandoned after the first failure. A system that supports quick recovery gets used for years.

---

# Part 6: The LLM-Native Design Philosophy

## 6.1 Designing for Claude Analysis

Every major design decision was made with LLM analysis in mind:

| Design Decision | How It Enables LLM Analysis |
|-----------------|----------------------------|
| JSON export | Machine-readable format |
| ISO date timestamps | Temporal pattern detection |
| Consistent metric IDs | Reliable data correlation |
| Structured note format | Qualitative pattern extraction |
| Multiple checkpoints/day | Trajectory analysis |

**The Prompt Engineering Insight**:

The quality of Claude's analysis depends on the quality of the data structure. By designing the export format carefully, I ensured that Claude could:
- Find correlations across metrics
- Quote specific notes as evidence
- Track changes over time
- Identify patterns I couldn't see

---

## 6.2 The CPO as Product Feature

The "Chief Psychological Officer" analysis isn't just a one-off experiment—it's a **product pattern**.

**Current Implementation**: Manual (export → upload → prompt → analyze)

**Future Implementation** (Product Roadmap):
1. **Automated Weekly Reports**: Claude API integration for scheduled analysis
2. **Real-time Interventions**: Push notification when high-risk patterns detected
3. **Insight Highlighting**: Surface relevant past notes during data entry
4. **Pattern Visualization**: Show correlations in-app, not just in reports

**The Product Insight**:

**LLMs aren't just for chatbots—they're analytical infrastructure.** The CPO report pattern could be applied to any domain where users generate structured qualitative + quantitative data over time.

---

# Conclusion: What This Demonstrates

## Product Skills Evidenced

| Skill | Evidence |
|-------|----------|
| **Problem Discovery** | Didn't assume the problem; let data reveal Identity Pressure |
| **User Empathy** | Deep understanding of my own needs through systematic self-study |
| **Platform Thinking** | Built flexible primitives, not rigid solutions |
| **Data Design** | Structured for analysis, not just display |
| **LLM-Native Design** | Optimized for Claude pattern extraction |
| **Iteration Velocity** | 4 → 19 metrics in 90 days based on usage |
| **Honest Evaluation** | Documented failures with same rigor as successes |
| **Systems Thinking** | Prevention vs. Mitigation framework |

## The Meta-Demonstration

The deepest product skill demonstrated is **using the product you build to discover things you didn't know**.

I didn't start with "Identity Pressure" as a concept. I started with "I can't stick to habits." The product—and the analysis it enabled—revealed the deeper structure.

**This is what product work should be**: building infrastructure that surfaces truth, then iterating based on what you learn.

---

*Product Perspective Document*
*December 4, 2025*

---

**Contact**: Kaushik Govindharajan
**Project**: SelfPM
