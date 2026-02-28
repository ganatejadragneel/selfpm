# SelfPM Case Study: From Dysregulation to Design System
## A Product Design Case Study in LLM-Native Behavioral Change

---

# Executive Summary

**SelfPM** is a precision habit tracking system I built to solve my own chronic self-regulation challenges. Over 90 days (September - December 2025), I evolved a simple 4-metric habit tracker into a 19-metric nervous system literacy platform that generates measurable behavioral improvements.

**Core Discovery**: Identity Pressure - the psychological weight of performance-based self-worth - is the master variable that predicts behavioral outcomes. When managed through structured morning routines, visualization, and nervous system awareness, outcomes dramatically improve.

**Key Outcomes**:
- 525% increase in days without cannabis
- 200% improvement in urge surfing success
- 112% increase in morning routine completion
- Development of a replicable behavioral intervention framework

**What This Demonstrates**:
- Problem identification in ambiguous human contexts
- Systems thinking applied to behavior change
- Data-driven product iteration
- LLM-native design and analysis methodology
- Measurable outcomes from self-designed interventions

---

# 1. Context & Problem Definition

## 1.1 The Personal Problem

I struggled with chronic patterns of:
- **Avoidance**: Postponing important tasks despite knowing consequences
- **Inconsistent habits**: Starting routines but failing to sustain them
- **Quick dopamine reliance**: Cannabis, scrolling, compulsive behaviors
- **Performance oscillation**: Periods of high output followed by crashes
- **Self-worth fusion**: Feeling worthless when not producing

## 1.2 The Emotional Cost

These patterns created a negative feedback loop:
```
Missed goal → Guilt/Shame → Identity pressure → Escape behavior
→ More guilt → Lower confidence → More avoidance → Repeat
```

The emotional toll included:
- Chronic low-grade anxiety
- Difficulty being present
- Relationship strain from unpredictability
- Career stagnation despite capability
- Loss of trust in self

## 1.3 Existing Attempts

Before SelfPM, I tried:
- **Spreadsheets**: High friction, abandoned within weeks
- **Generic habit apps**: No customization, no analysis
- **Journaling**: Inconsistent, no pattern extraction
- **Willpower**: Temporary improvements, no sustainability

These failed because they treated symptoms (missed habits) rather than causes (identity pressure, nervous system dysregulation).

---

# 2. Discovery & Core Insight

## 2.1 The Turning Point: November 10-27

Through consistent self-tracking and LLM-assisted pattern analysis, I discovered a framework:

### Independent Variables (Controllable Inputs)
- Sleep quality and duration
- Morning meditation (Jabam)
- Reading for learning
- Visualization/planning (MCC)
- Exercise
- Substance avoidance

### Dependent Variables (Observable Outcomes)
- Body state (tension, relaxation)
- **Identity Pressure** (core predictor)
- Craving intensity
- Urge response behavior
- Overall day quality

### The Key Insight

**Identity Pressure** emerged as the master variable. It's the psychological weight created by:
- Unfinished tasks (especially important but non-urgent ones)
- Ambiguous goals without clear completion criteria
- Performance-based self-worth beliefs
- External expectations and conditional love patterns

When Identity Pressure is high, cravings intensify and self-regulation deteriorates. When managed through morning routines and visualization, outcomes improve dramatically.

## 2.2 The Conditional Love Discovery

The deepest insight came from examining WHY identity pressure existed:

> "I realized that it was what I did receive -- conditional love. Conditional on performance, on achievement. Which is why I struggle to just 'be', and constantly need to prove my worth, to just be happy."

**Implication**: The behavioral interventions work by creating unconditional self-care rituals that build a foundation of self-acceptance not dependent on performance.

---

# 3. Design Constraints & Principles

## 3.1 Design Principles

Based on my own resistance patterns, I established:

1. **Low Friction**: Data entry under 2 minutes daily
2. **Rich Context**: Notes attached to every metric
3. **Narrative Analytics**: Quantitative + qualitative together
4. **Psychological Safety**: Self-honesty without shame
5. **Immediate Feedback**: Daily summary, weekly pattern analysis
6. **Adaptive Metrics**: Evolve as understanding deepens
7. **Causality Focus**: Independent variables must explain dependent ones

## 3.2 Technical Decisions

- **Stack**: React 19, TypeScript, Tailwind CSS, Supabase, Zustand
- **Data Model**: Flexible schema allowing metric evolution
- **Notes**: 600-character contextual annotations per entry
- **Export**: Full JSON export for LLM analysis
- **Privacy**: Self-hosted analysis, no third-party data sharing

---

# 4. Solution: The SelfPM System

## 4.1 Daily Metric System

**Evolution**: 4 → 19 metrics over 90 days

| Phase | Metrics | Focus |
|-------|---------|-------|
| Sep | 4 | Basic habits |
| Nov 9 | 5 | Added reading |
| Nov 11 | 12 | Nervous system literacy |
| Nov 30 | 19 | Full behavioral model |

**What It Solved**: "I don't know what's wrong with me" → Clear quantification of states

## 4.2 Contextual Notes

Every metric entry supports a 600-character note explaining context.

**Example Entry**:
> "Officially dodged my first craving today at 9:45a. I did 5 pushups, and now finished my reading and also updated selfpm. I feel so amazing. Ready for the next one."

**What It Solved**: "I forget why I failed/succeeded" → Rich pattern extraction

## 4.3 LLM-Based Pattern Analysis

Weekly "CPO Reports" (Chief Psychological Officer) analyze:
- Metric correlations
- Consistency patterns
- Intervention effectiveness
- Forward recommendations

**What It Solved**: "I can't see my own patterns" → Automated insight generation

## 4.4 Nervous System Literacy Layer

Body-state metrics at multiple checkpoints:
- Body State on Waking (morning calibration)
- 2pm Body Check-In (mid-day tension)
- Evening Body Check-In (end-of-day state)

**What It Solved**: "I react without understanding why" → Somatic awareness

## 4.5 Intervention Protocols

Data-derived protocols for specific states:

**Urge Surfing Protocol**:
1. Recognize → Breathe → Move → Change environment → Engage task → Record

**High Identity Pressure Protocol**:
1. Acknowledge → Identify source → Define done → Visualize → Start small → Separate worth

**What It Solved**: "I fall into old patterns" → Specific, repeatable interventions

---

# 5. Implementation Journey

## 5.1 Development Process

**Week 1-2**: Basic habit tracking (boolean metrics)
**Week 3-4**: Added dropdown metrics for nuanced states
**Week 5-6**: Implemented notes system for qualitative data
**Week 7-8**: Built export functionality for LLM analysis
**Week 9-10**: Created visualization features (MCC)
**Week 11-12**: Refined based on pattern discoveries

## 5.2 Iteration Cycles

Each week followed a pattern:
1. **Collect**: Daily metric entry with notes
2. **Export**: JSON dump for analysis
3. **Analyze**: Claude-assisted pattern recognition
4. **Adjust**: Add/modify metrics, update protocols
5. **Repeat**: Test new hypotheses

## 5.3 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Boolean vs. Ordinal | Habits are binary; states are spectrums |
| 600-char notes | Enough for context, short enough for discipline |
| Morning timing | Identity Pressure must be captured at 10am |
| Evening checkpoints | Bookend data reveals full-day arc |
| Weekly exports | Frequent enough for iteration, not overwhelming |

---

# 6. Outcomes

## 6.1 Behavioral Improvements

| Metric | September | December | Change |
|--------|-----------|----------|--------|
| Days without cannabis | 4 | 25+ consecutive | +525% |
| Morning routine completion | 40% | 85% | +112% |
| Urge surfing success | 20% | 60% | +200% |
| Sleep 7+ hours | 30% | 55% | +83% |
| Exercise consistency | 35% | 65% | +86% |

## 6.2 Cognitive Improvements

- **Self-awareness**: Can identify trigger → feeling → behavior chains
- **Nervous system literacy**: Recognize jaw tension, chest tightness as early warnings
- **Emotional labeling**: Distinguish between tiredness, anxiety, identity pressure
- **Pattern recognition**: Predict vulnerable periods before they occur
- **Intervention deployment**: Apply correct protocol for specific states

## 6.3 System Thinking Development

- Created behavioral model with independent/dependent variables
- Mapped causal relationships between inputs and outcomes
- Developed intervention protocols for different states
- Built feedback loops for continuous improvement
- Generated exportable, analyzable data structure

## 6.4 Product Skill Outcomes

- Built a functioning full-stack application
- Learned data-driven habit modeling
- Mastered rapid iteration cycles
- Translated introspection → feature requirements
- Developed LLM-assisted analysis workflows
- Practiced narrative UX design

---

# 7. What This Demonstrates

## 7.1 Problem-Finding Ability

I identified a problem that:
- No one asked me to solve
- Had no obvious solution
- Required deep personal investigation
- Generated generalizable insights

## 7.2 Systems Thinking

I built a model that:
- Separates inputs from outputs
- Identifies causal relationships
- Creates measurable feedback loops
- Evolves based on data

## 7.3 Product Craft

I demonstrated:
- Low-friction design for daily use
- Qualitative + quantitative data integration
- Iterative feature development
- User psychology understanding (myself as user)
- LLM-native analysis integration

## 7.4 Measurable Outcomes

Every claim is backed by data:
- 850+ completion records
- 350+ contextual notes
- 90 days of tracking
- Quantified before/after improvements

## 7.5 LLM-Native Thinking

I used Claude for:
- Pattern recognition in journal entries
- Hypothesis generation from data
- CPO report drafting
- Protocol refinement
- This very case study

---

# 8. Artifacts Included

This case study package includes:

1. **CPO Report (Dec 1, 2025)**: Comprehensive behavioral analysis
2. **Metrics Catalog**: Complete list of all 19 tracked metrics
3. **Raw Data Summary**: Statistics and sample entries from the data export
4. **Analysis & Insights**: Deep dive into patterns and discoveries
5. **This Case Study**: Narrative synthesis of the journey

---

# 9. Key Quotes from the Data

> "I have begun to understand the root cause of my urges so well, that today, I literally knew my urge when it came. I could recognize it is because I had some kind of identity pressure." - Nov 14

> "I don't have a 'definition of done' for the tasks I do. This is it. I actually don't know when I've finished a task." - Nov 17

> "Craving is not a command, but a memory. BEAT THE MEMORY. MAKE NEW ONES!" - Nov 26

> "Great sleep and morning routines really are the KEY to setting myself up for the day." - Nov 29

> "I have trained for this. I am a person that knows how to mitigate these situations." - Dec 1

---

# 10. Conclusion

SelfPM represents more than a habit tracker - it's a methodology for understanding and changing human behavior through:

1. **Precise measurement** of internal states
2. **Pattern recognition** through data analysis
3. **Causal modeling** of behavioral dynamics
4. **Intervention design** based on evidence
5. **Continuous iteration** based on outcomes

The most profound insight is not behavioral but psychological: **Identity Pressure stems from conditional self-worth patterns. By creating unconditional self-care rituals, we build a foundation of self-acceptance that doesn't depend on performance.**

This is what I mean by "LLM-native behavioral change" - using AI not as a gimmick but as analytical infrastructure for understanding complex human patterns.

---

*Case Study Generated: December 1, 2025*
*Data Period: September 2 - December 1, 2025*
*Total Data Points: 1,200+ entries across 90 days*

---

**Contact**: Kaushik Govindharajan
**Project**: SelfPM - https://github.com/kaushikgovindharajan/selfPM
