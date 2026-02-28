# V0 Portfolio Build Instructions
## Kaushik Govindharajan - Personal Portfolio

---

# PROJECT OVERVIEW

Build a personal portfolio website with a warm, editorial design aesthetic. The portfolio showcases product case studies with a focus on storytelling and product thinking. The design should feel thoughtful, professional, and human—not cold or overly technical.

**Tech Stack**: Next.js, Tailwind CSS, Framer Motion for animations

---

# DESIGN SYSTEM

## Colors

```css
:root {
  /* Backgrounds */
  --bg-primary: #FFFBF7;      /* Warm cream - main background */
  --bg-secondary: #F4F1ED;    /* Warm gray - callout boxes, cards */
  --bg-dark: #1A1A1A;         /* Dark sections if needed */

  /* Text */
  --text-primary: #1A1A1A;    /* Main text */
  --text-secondary: #4A4A4A;  /* Secondary text */
  --text-muted: #7A7A7A;      /* Muted/caption text */

  /* Accents */
  --accent-primary: #E07A5F;  /* Terracotta/coral - primary accent */
  --accent-secondary: #3D5A80; /* Muted blue - secondary accent */
  --accent-success: #81B29A;  /* Sage green - positive metrics */

  /* Borders & Lines */
  --border-light: #E8E4E0;    /* Light borders */
  --border-dark: #D4CFC9;     /* Darker borders */
}
```

## Typography

```css
/* Headings - Editorial Serif */
font-family: 'Fraunces', 'Playfair Display', Georgia, serif;

/* Body - Clean Sans */
font-family: 'DM Sans', 'Inter', -apple-system, sans-serif;

/* Callouts/Labels - Mono or Small Caps */
font-family: 'JetBrains Mono', 'SF Mono', monospace;

/* Scale */
--text-hero: 4rem;        /* 64px - Main hero text */
--text-h1: 2.5rem;        /* 40px - Page titles */
--text-h2: 1.75rem;       /* 28px - Section headers */
--text-h3: 1.25rem;       /* 20px - Subsection headers */
--text-body: 1rem;        /* 16px - Body text */
--text-small: 0.875rem;   /* 14px - Captions, labels */
--text-xs: 0.75rem;       /* 12px - Tags, metadata */
```

## Spacing

```css
--space-xs: 0.5rem;    /* 8px */
--space-sm: 1rem;      /* 16px */
--space-md: 1.5rem;    /* 24px */
--space-lg: 2.5rem;    /* 40px */
--space-xl: 4rem;      /* 64px */
--space-2xl: 6rem;     /* 96px */

/* Max content width */
--max-width-content: 720px;   /* For readable text */
--max-width-wide: 1200px;     /* For full-width sections */
```

## Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 16px;
--radius-xl: 24px;
```

---

# PAGE 1: LANDING PAGE

## Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (sticky, minimal)                                        │
│ Logo/Name                                    Contact | LinkedIn │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ HERO SECTION (full viewport height, centered)                  │
│                                                                 │
│                     KAUSHIK GOVINDHARAJAN                       │
│                                                                 │
│              I build solutions that increase                    │
│                human capacity at scale.                         │
│                                                                 │
│                 Read full mission statement →                   │
│                                                                 │
│                          ↓ (scroll indicator)                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ WORK SECTION                                                    │
│                                                                 │
│                      EXPLORE MY WORK                            │
│                                                                 │
│    ┌─────────────────────┐    ┌─────────────────────┐          │
│    │                     │    │                     │          │
│    │    📊 SelfPM        │    │   🏢 Cardinality    │          │
│    │                     │    │                     │          │
│    │  Personal Product   │    │  Enterprise Product │          │
│    │    Case Study       │    │    Case Study       │          │
│    │                     │    │                     │          │
│    │  A 90-day journey   │    │   (Coming Soon)     │          │
│    │  building a self-   │    │                     │          │
│    │  research platform  │    │                     │          │
│    │                     │    │                     │          │
│    │  View Case Study →  │    │                     │          │
│    │                     │    │                     │          │
│    └─────────────────────┘    └─────────────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                                          │
│ © 2025 Kaushik Govindharajan        LinkedIn | GitHub | Email  │
└─────────────────────────────────────────────────────────────────┘
```

## Hero Section Details

**Layout**: Centered, full viewport height (100vh), flex column centered

**Content**:
```
Name: KAUSHIK GOVINDHARAJAN
- Typography: Fraunces, 4rem (64px), font-weight 600
- Letter-spacing: 0.02em
- Color: var(--text-primary)

Mission Statement: "I build solutions that increase human capacity at scale."
- Typography: DM Sans, 1.5rem (24px), font-weight 400
- Color: var(--text-secondary)
- Max-width: 600px
- Margin-top: 1.5rem

Link: "Read full mission statement →"
- Typography: DM Sans, 1rem, font-weight 500
- Color: var(--accent-primary)
- Underline on hover
- Margin-top: 1rem
- Arrow animates right on hover

Scroll Indicator:
- Animated chevron or line at bottom
- Subtle bounce animation
- Fades after user scrolls
```

**Animations**:
- Name fades in and slides up (0.6s ease-out, 0.2s delay)
- Mission statement fades in and slides up (0.6s ease-out, 0.4s delay)
- Link fades in (0.6s ease-out, 0.6s delay)
- Scroll indicator fades in after 1.5s

## Work Section Details

**Layout**:
- Section padding: var(--space-2xl) top/bottom
- Background: var(--bg-secondary)
- Max-width: var(--max-width-wide)
- Centered

**Section Header**:
```
"EXPLORE MY WORK"
- Typography: JetBrains Mono, 0.875rem, uppercase, letter-spacing 0.1em
- Color: var(--text-muted)
- Margin-bottom: var(--space-xl)
```

**Project Cards**:
- Display: Grid, 2 columns, gap 2rem
- On mobile: Single column
- Card background: var(--bg-primary)
- Border: 1px solid var(--border-light)
- Border-radius: var(--radius-lg)
- Padding: var(--space-lg)
- Box-shadow: 0 4px 20px rgba(0,0,0,0.04)

**Card Content**:
```
Icon/Emoji: 📊 or small illustration
- Size: 2rem
- Margin-bottom: var(--space-md)

Title: "SelfPM"
- Typography: Fraunces, 1.75rem, font-weight 600
- Color: var(--text-primary)

Subtitle: "Personal Product Case Study"
- Typography: JetBrains Mono, 0.75rem, uppercase
- Color: var(--accent-primary)
- Letter-spacing: 0.05em
- Margin-top: 0.25rem

Description: "A 90-day journey building a self-research platform that revealed Identity Pressure as the hidden driver of self-regulation."
- Typography: DM Sans, 1rem
- Color: var(--text-secondary)
- Margin-top: var(--space-sm)
- Line-height: 1.6

CTA: "View Case Study →"
- Typography: DM Sans, 0.875rem, font-weight 600
- Color: var(--accent-primary)
- Margin-top: var(--space-md)
- Arrow animates right on hover
```

**Card Hover State**:
- Transform: translateY(-4px)
- Box-shadow: 0 8px 30px rgba(0,0,0,0.08)
- Border-color: var(--accent-primary)
- Transition: all 0.3s ease

**Cardinality Card**:
- Same structure but with "Coming Soon" badge
- Slightly muted (opacity 0.7)
- No hover animation
- Badge: Small pill with "Coming Soon" text

---

# PAGE 2: SELFPM CASE STUDY

## URL: /case-study/selfpm

## Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (sticky)                                                 │
│ ← Back to Portfolio                          Progress indicator │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CASE STUDY HERO                                                 │
│                                                                 │
│           SelfPM: From Dysregulation to                         │
│              Regulatory Literacy                                │
│                                                                 │
│   A Case Study in Building Self-Understanding Through Product  │
│                                                                 │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│   │ 1,400+  │ │   19    │ │ 90 days │ │ +525%   │              │
│   │ data pts│ │ metrics │ │ tracked │ │ improve │              │
│   └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ EXECUTIVE SUMMARY                                               │
│ [Brief intro paragraph]                                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ THE JOURNEY (with progress line on left side)                  │
│                                                                 │
│  ●─── PHASE 1: THE PROBLEM                                      │
│  │    "I thought it was about habits. It wasn't."              │
│  │                                                              │
│  │    [Content...]                                              │
│  │                                                              │
│  │    ┌──────────────────────────────────────┐                 │
│  │    │ 🔧 PRODUCT DECISION                   │                 │
│  │    │ Built flexible metric system...       │                 │
│  │    └──────────────────────────────────────┘                 │
│  │                                                              │
│  ●─── PHASE 2: THE UNDERSTANDING                                │
│  │    "Prevention vs. Mitigation"                              │
│  │                                                              │
│  │    [Content...]                                              │
│  │                                                              │
│  ●─── PHASE 3: THE EXECUTION                                    │
│  │    "Winning the Moment of Decision"                         │
│  │                                                              │
│  │    [Content...]                                              │
│  │                                                              │
│  ●─── RESULTS & TRANSFORMATION                                  │
│       [Metrics table, quotes, outcomes]                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ KEY INSIGHTS                                                    │
│ [7 principles as cards]                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ THE META-INSIGHT                                                │
│ [User-Creator Empathy section]                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ FOOTER                                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Case Study Hero Section

**Layout**:
- Full width, centered content
- Padding: var(--space-2xl) top, var(--space-xl) bottom
- Background: var(--bg-primary)

**Back Link**:
```
"← Back to Portfolio"
- Position: Top left
- Typography: DM Sans, 0.875rem
- Color: var(--text-muted)
- Hover: var(--text-primary)
```

**Title**:
```
"SelfPM: From Dysregulation to Regulatory Literacy"
- Typography: Fraunces, 2.5rem (desktop) / 1.75rem (mobile)
- Font-weight: 600
- Color: var(--text-primary)
- Text-align: center
- Max-width: 800px
```

**Subtitle**:
```
"A Case Study in Building Self-Understanding Through Product"
- Typography: DM Sans, 1.125rem
- Color: var(--text-secondary)
- Text-align: center
- Margin-top: var(--space-sm)
```

**Stats Row**:
```
Four stat boxes in a row (grid on desktop, 2x2 on mobile)

Each stat box:
- Background: var(--bg-secondary)
- Border-radius: var(--radius-md)
- Padding: var(--space-md)
- Text-align: center

Number:
- Typography: Fraunces, 1.5rem, font-weight 700
- Color: var(--accent-primary)

Label:
- Typography: DM Sans, 0.75rem
- Color: var(--text-muted)
- Margin-top: 0.25rem

Stats:
1. "1,400+" / "data points"
2. "19" / "custom metrics"
3. "90" / "days tracked"
4. "+525%" / "improvement"
```

---

## Executive Summary Section

**Layout**:
- Max-width: var(--max-width-content) (720px)
- Centered
- Padding: var(--space-xl) vertical
- Border-bottom: 1px solid var(--border-light)

**Content**:
```markdown
This case study documents a 90-day transformation from unconscious dysregulation to conscious regulatory literacy—told through the lens of someone who was simultaneously the user, the creator, the data source, and the analyst.

What began as a simple habit tracker evolved into a self-research platform that revealed **Identity Pressure**—the psychological weight of unfinished tasks, ambiguous goals, and performance-based self-worth—as the master variable predicting behavioral outcomes.

I tracked escape behaviors (the activities my nervous system used to discharge pressure in unhealthy ways), built analytical infrastructure for pattern detection, and developed intervention protocols based on real data. The specific behaviors matter less than the pattern: they all correlated with unmanaged Identity Pressure and incomplete morning routines.

**The key insight**: Urges are not commands to release pressure. They are alarms telling me I have regulatory debt to pay. The sooner I pay it, the better.
```

**Typography**:
- Body: DM Sans, 1.125rem, line-height 1.8
- Bold phrases: font-weight 600
- Blockquote/key insight:
  - Left border: 3px solid var(--accent-primary)
  - Padding-left: var(--space-md)
  - Font-style: italic
  - Background: var(--bg-secondary)
  - Padding: var(--space-md)
  - Border-radius: var(--radius-md)

---

## The Journey Section (Main Content)

**Layout**:
- Max-width: var(--max-width-content)
- Centered
- Left side: Progress line with phase markers
- Right side: Content

**Progress Line**:
```css
/* Vertical line on the left */
.progress-line {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(
    to bottom,
    var(--accent-primary) 0%,
    var(--accent-success) 100%
  );
}

/* Phase markers */
.phase-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-primary);
  border: 3px solid var(--bg-primary);
  position: absolute;
  left: -7px;
}

/* Active phase marker (on scroll) */
.phase-marker.active {
  transform: scale(1.2);
  box-shadow: 0 0 0 4px rgba(224, 122, 95, 0.2);
}
```

**Phase Block Structure**:
```
Each phase:
- Padding-left: var(--space-xl) (to accommodate progress line)
- Padding-bottom: var(--space-2xl)
- Position: relative

Phase Header:
- "PHASE 1" - JetBrains Mono, 0.75rem, uppercase, var(--accent-primary)
- "THE PROBLEM" - Fraunces, 1.75rem, var(--text-primary)
- Tagline in quotes - DM Sans, 1.125rem, italic, var(--text-secondary)

Phase Content:
- Prose paragraphs - DM Sans, 1rem, line-height 1.8
- Block quotes (from journal) - styled distinctly
- Tables where relevant
- Product Decision callout boxes
```

**Journal Quote Styling**:
```css
.journal-quote {
  background: var(--bg-secondary);
  border-left: 3px solid var(--accent-secondary);
  padding: var(--space-md);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin: var(--space-md) 0;
}

.journal-quote .date {
  font-family: 'JetBrains Mono';
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.journal-quote .text {
  font-family: 'DM Sans';
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-style: italic;
  line-height: 1.7;
}
```

**Product Decision Callout Box**:
```css
.product-callout {
  background: linear-gradient(135deg, #FFF9F5 0%, #FFF5EE 100%);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin: var(--space-lg) 0;
  position: relative;
}

.product-callout::before {
  content: "🔧";
  position: absolute;
  top: -12px;
  left: var(--space-md);
  background: var(--bg-primary);
  padding: 0 0.5rem;
}

.product-callout .label {
  font-family: 'JetBrains Mono';
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
  margin-bottom: 0.5rem;
}

.product-callout .title {
  font-family: 'Fraunces';
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.product-callout .description {
  font-family: 'DM Sans';
  font-size: 0.95rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
```

**Table Styling** (for metrics, comparisons):
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-md) 0;
  font-family: 'DM Sans';
  font-size: 0.95rem;
}

.data-table th {
  background: var(--bg-secondary);
  padding: var(--space-sm);
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--border-dark);
}

.data-table td {
  padding: var(--space-sm);
  border-bottom: 1px solid var(--border-light);
}

.data-table .metric-value {
  font-family: 'JetBrains Mono';
  color: var(--accent-success);
  font-weight: 600;
}

.data-table .metric-change.positive {
  color: var(--accent-success);
}
```

---

## PHASE CONTENT (Masked Version)

### PHASE 1: THE PROBLEM
**"I thought it was about habits. It wasn't."**

**Intro Paragraph**:
Like most people who struggle with self-regulation, I initially framed my problem as a habit problem: I couldn't stick to morning routines, I kept falling into escape behaviors, I oscillated between high-performance periods and complete crashes.

On September 2, 2025, I launched the first version of SelfPM with 4 simple metrics: Morning meditation (Jabam), Evening meditation (Jabam), Exercise, and Avoid escape behavior.

**The assumption**: If I just tracked these behaviors, consistency would follow.

**Section: The First Clue**

The September data revealed something unexpected. I wasn't just "forgetting" habits or "being lazy." There was a pattern:

[Journal Quote - Sep 8, 2025]
"Doing an okay job, but my god how I would love to feel unhooked from the burden of expectation and just flow through the day. I'm currently at a standstill and I feel the worst... I feel TERRIBLE."

[Journal Quote - Sep 11, 2025]
"I am definitely spiraling. I have had a major relapse and have fallen into escape behaviors every night for a week. My sleep is disrupted and my mornings are disrupted. I know that I will get through this but it's hard to see the light at the end of the tunnel right now."

The entries showed something clear: **my behavioral failures weren't random—they followed a predictable emotional/physiological sequence.**

**Section: The Vicious Cycle**

Through weeks of tracking and note-taking, a pattern emerged:

```
Missed goal / Unfinished task
        ↓
   Guilt / Shame
        ↓
   Escape behavior
        ↓
   Temporary relief
        ↓
   More guilt → Lower confidence → More avoidance
        ↓
   REPEAT
```

But the critical insight wasn't the cycle itself—it was **what triggered it**.

**Section: The November 10 Breakthrough**

On November 10, 2025, after 70 days of tracking, I ran a "CPO Analysis" (Chief Psychological Officer) with Claude on my exported data. The report identified something I had never named:

**Identity Pressure** = the psychological weight created by:
- Unfinished tasks (especially important but non-urgent ones)
- Ambiguous goals without clear completion criteria
- Performance-based self-worth beliefs
- External expectations and conditional love patterns

[Journal Quote - Nov 14, 2025]
"I have begun to understand the root cause of my urges so well, that today, I literally knew my urge when it came. I could recognize it is because I had some kind of identity pressure."

**The Problem Reframed**:

Old framing: "I have bad habits. I need more discipline."

New framing: "I accumulate **regulatory debt** throughout the day. When the debt gets too high, my nervous system demands payment—through urges, cravings, and escape behaviors. These aren't failures of willpower. They're **alarms** telling me I owe my body something."

[Key Insight Box]
"Urges are not commands to release pressure. They are ALARMS telling me I have regulatory debt to pay. The sooner I pay it, the better."

**[PRODUCT DECISION CALLOUT]**
**Flexible Metric Architecture**
Built a system where users can create custom habits with three input types (Boolean, Dropdown, Custom Options) rather than pre-defining what to track. This flexibility allowed me to evolve from tracking behaviors to tracking internal states—which is where the real insights lived. The same infrastructure that tracks "Exercise" also tracks "Identity Pressure (10am)"—a metric I invented on Nov 11.

---

### PHASE 2: THE UNDERSTANDING
**"Prevention vs. Mitigation"**

With Identity Pressure identified as the core issue, the question became: **How do I manage it?**

November 11-27, 2025 was the period of deepest learning. I expanded from 4 metrics to 15, adding nervous system checkpoints throughout the day.

**Section: The Two Modes of Intervention**

Through pattern analysis, I discovered that interventions fell into two categories:

**1. PREVENTION (Anchor Tasks)**

[TABLE]
| Anchor Task | Function | Data Evidence |
|-------------|----------|---------------|
| Morning Jabam (5:30am) | Nervous system calibration | Days with morning jabam: 85% completion on other tasks. Without: 45% |
| Reading (10 pages) | Cognitive priming | Builds patience, reduces urgency addiction |
| MCC Visualization | "Definition of done" clarity | Reduces ambiguity that creates IP |
| Exercise | Physical regulatory discharge | 14% lower craving intensity on exercise days |

**Critical Finding**: The morning routine creates a **regulatory buffer** for the day.

[Journal Quote - Nov 21, 2025]
"Morning Command Center Works! Its so important to win the morning. For sure it will save the rest of your day."

**2. MITIGATION (Instant Interventions)**

[TABLE]
| Technique | When to Use | How It Works |
|-----------|-------------|--------------|
| Parasympathetic Breathing | First sign of urge | Activates vagus nerve, interrupts fight-or-flight |
| 5-10 Pushups | When cravings intensify | Redirects nervous energy, demonstrates agency |
| Walking (1+ mile) | When highly dysregulated | Full-body regulation reset |
| Environment Change | When stuck in loop | Breaks pattern association |
| Journaling in SelfPM | After urge passes | Consolidates learning |

[Journal Quote - Nov 24, 2025]
"Officially dodged my first craving today at 9:45a. I did 5 pushups, and now finished my reading and also updated selfpm. I feel so amazing. Ready for the next one."

**[PRODUCT DECISION CALLOUT]**
**600-Character Contextual Notes**
Attached a substantial text field to every metric entry, every day. Originally 200 characters (felt restrictive), expanded to 600 based on usage friction. Added voice input (Web Speech API) for faster capture. These notes aren't journaling—they're structured qualitative data that enabled the CPO analysis. Claude could correlate what I wrote on high-IP days vs. low-IP days and surface patterns I couldn't see.

**Section: The First Wave Theory**

Analysis revealed a crucial pattern: the first urge of the day is pivotal.

[Journal Quote - Nov 25, 2025]
"Its just the most crucial thing in the world to have one task after another, and to have the entire morning planned out, and to do the High Identity pressure tasks first thing in the morning, and MOST importantly, to surf the first urge of the day and not relent to it. Its a very slippery slope."

When I successfully navigated the first urge:
- 72% of subsequent urges were also navigated
- Day quality rating averaged 7.8/10
- Zero cascade behaviors

When I caved to the first urge:
- Only 23% of subsequent urges were navigated
- Day quality rating averaged 4.2/10
- Average of 3.4 additional escape behaviors followed

**Section: The Conditional Love Root**

The deepest insight came from asking why Identity Pressure existed at all:

[Journal Quote]
"I realized that it was what I did receive—conditional love. Conditional on performance, on achievement. Which is why I struggle to just 'be', and constantly need to prove my worth, to just be happy."

**Implication**: The anchor tasks work because they're **unconditional self-care rituals**—practices that say "I am worth taking care of" before I've accomplished anything.

**[PRODUCT DECISION CALLOUT]**
**Multiple Checkpoints Per Day**
Implemented tracking at multiple times: Body State on Waking, Identity Pressure at 10am, 2pm Body Check-In, Evening Body Check-In, Overall Day Quality at 8pm. A single daily check-in would tell me if a day was "good" or "bad." Multiple checkpoints reveal the trajectory—how I moved from morning to evening, where things went wrong, what interventions worked.

---

### PHASE 3: THE EXECUTION
**"Winning the Moment of Decision"**

Understanding the model was only half the battle. The challenge became: Can I actually execute when it matters?

**Section: The November 27 Test**

On November 27, I experienced what could have been a full regression:

[Journal Quote - Nov 27, 2025]
"First day back, and I've fallen into escape behavior immediately. I won't judge myself, but just use this as a data point. Even though I had increased my nervous system literacy by SO much, and knew exactly what triggers me, I was just too weak to resist it."

What was different this time? **The awareness.**

[Journal Quote - Nov 27, 2025]
"I feel like today was a failure of health and literally 'vitality' to make an important 'execution' decision. Lesson here is to be well fed and well rested, in order to make decisions."

Instead of spiraling into shame and multi-day regression, I:
1. Documented what happened without judgment
2. Identified the specific vulnerability (travel fatigue, loneliness, hunger)
3. Ran a CPO analysis that night
4. Re-committed to anchor tasks the next morning

**Section: The Recovery**

Just 48 hours after the relapse:

[Journal Quote - Nov 29, 2025]
"After a few day break, got my Morning routine back in order... I feel great to have gotten up, done jabam, reading, and then MCC before I started the day. I feel fantastic!"

[Journal Quote - Nov 29, 2025]
"Only very minor cravings so far. Its 4:15pm. I felt small urges, but the quality of my day so far (morning routine, finishing 2/3 of my goals), has just made me so happy and fulfilled from inside, I literally have no craving at all."

**The key execution insight**: Recovery time matters more than perfection. Pre-SelfPM, a relapse like November 27 would have become a week-long spiral. With the framework, recovery took 36 hours.

**Section: Real-Time Execution**

December 1, 2025 captured a perfect execution example:

[Journal Quote - Dec 1, 2025]
"I feel quite unmotivated this morning. I literally want to just lie back down and sleep the rest of the day. I think my tiredness from yesterday, and lack of sleep are showing. I feel aimless.

**I have trained for this. I am a person that knows how to mitigate these situations.** I will get up, do 5 pushups, breathe 10 times, eat an apple, change my environment, plan my week, and start with my core Quadrant 2 task."

This is execution in action:
1. **Recognition** ("I feel aimless")
2. **Self-identification** ("I am a person that knows how to mitigate")
3. **Protocol deployment** (pushups, breathing, food, environment)
4. **Task engagement** (plan week, start core task)

**[PRODUCT DECISION CALLOUT]**
**Data Export for LLM Analysis**
Built one-click JSON export of all data—tasks, completions, notes, metadata. The built-in analytics could show completion rates, but couldn't answer questions like "What predicts high Identity Pressure days?" or "What patterns precede cascade failures?" The export feature made the CPO analysis possible. Design for analysis, not just display.

---

### RESULTS & TRANSFORMATION

**The Quantified Transformation**

[RESULTS TABLE - Large, prominent styling]
| Metric | September Baseline | December Current | Change |
|--------|-------------------|------------------|--------|
| Days without escape behaviors | ~4/month | 25+ consecutive | +525% |
| Morning routine completion | ~40% | 85% | +112% |
| Urge surfing success rate | ~20% | 60% | +200% |
| Sleep 7+ hours | 30% | 55% | +83% |
| Recovery time after slip | 5-7 days | 1-2 days | -75% |

**From External Tracking to Internal Sensing**

The most profound shift is that I now feel what I used to only track:

[Journal Quote - Nov 21, 2025]
"SO amazing. So soft. I felt great waking up at 4:40a... I just feel so literate about myself now... Morning state is really dependent on how much time I have for myself that morning. Keep it free. Wake up before the world, and enjoy your peace."

**The Emerging Identity**

Something subtle but significant emerged:

[Journal Quote - Nov 26, 2025]
"Craving is not a command, but a memory. BEAT THE MEMORY. MAKE NEW ONES!"

[Journal Quote - Nov 29, 2025]
"I was able to surf urges SO easily. Its excellent. Maybe, at this point, because I believe in the correlation between the two so strongly, every time I get my routine and goals in order, I just don't feel like releasing the urge, because I'm telling myself I don't even have it because of the good work I've done!!"

The identity is shifting from "someone who struggles with urges" to "someone who understands and navigates urges skillfully."

---

## Key Insights Section

**Layout**:
- Background: var(--bg-secondary)
- Padding: var(--space-2xl) vertical
- Grid of insight cards (2 columns desktop, 1 column mobile)

**Section Header**:
"CORE PRINCIPLES"
- Typography: JetBrains Mono, 0.875rem, uppercase
- Color: var(--text-muted)

**Insight Cards**:
```css
.insight-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.insight-card .number {
  font-family: 'Fraunces';
  font-size: 2rem;
  color: var(--accent-primary);
  opacity: 0.3;
}

.insight-card .title {
  font-family: 'Fraunces';
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.insight-card .description {
  font-family: 'DM Sans';
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
  line-height: 1.6;
}
```

**The 7 Principles**:

1. **Urges are alarms, not commands.** They signal regulatory debt, not character flaws.

2. **Prevention > Mitigation.** Anchor tasks prevent debt accumulation. Mitigation manages acute moments.

3. **Win the first decision.** The first urge of the day sets the trajectory.

4. **Define "done" clearly.** Ambiguous tasks create persistent Identity Pressure.

5. **Distinguish IP from fatigue.** Sometimes you need pushups; sometimes you need rest.

6. **Recovery speed > Perfection.** A slip that recovers in 36 hours is a win.

7. **Conditional love is the root.** Anchor tasks work because they're unconditional self-care.

---

## The Meta-Insight Section

**Layout**:
- Max-width: var(--max-width-content)
- Centered
- Padding: var(--space-2xl) vertical
- Slightly different background treatment to stand out

**Content**:

**Header**: "THE META-INSIGHT: USER-CREATOR EMPATHY"

What makes this case study unique is the dual perspective.

As the **creator**, I built a system to track behaviors. As the **user**, I discovered that the behaviors were symptoms, not causes. As the **analyst**, I identified Identity Pressure as the master variable. As the **data source**, I lived the patterns and proved the interventions.

This loop—build → use → analyze → refine—creates a depth of product empathy that's impossible to achieve any other way.

**The takeaway for product development**: The best products come from deep personal need + systematic analysis of that need + continuous iteration based on real use.

**[PRODUCT SKILLS DEMONSTRATED - Final summary box]**

| Skill | Evidence |
|-------|----------|
| Problem Discovery | Didn't assume the problem; let data reveal Identity Pressure |
| User Empathy | Deep understanding through systematic self-study |
| Platform Thinking | Built flexible primitives, not rigid solutions |
| Data Design | Structured for analysis, not just display |
| LLM-Native Design | Optimized for Claude pattern extraction |
| Iteration Velocity | 4 → 19 metrics in 90 days based on usage |
| Honest Evaluation | Documented failures with same rigor as successes |

---

## Footer

**Content**:
- Case study metadata (date, data period, data points)
- Contact info
- Back to portfolio link
- Social links

---

# ANIMATIONS & INTERACTIONS

## Page Load Animations

**Hero Section**:
- Title fades in + slides up (0.6s, 0.2s delay)
- Subtitle fades in + slides up (0.6s, 0.4s delay)
- Stats cards stagger in from bottom (0.4s each, 0.1s stagger)

**Scroll Animations**:
- Phase sections fade in as they enter viewport
- Product callout boxes slide in from right
- Journal quotes fade in with slight scale (0.95 → 1)
- Progress line fills as user scrolls
- Phase markers animate to "active" state

## Hover Interactions

**Cards**:
- Transform: translateY(-4px)
- Box-shadow deepens
- Border color transitions to accent

**Links**:
- Color transitions
- Arrow icons slide right
- Underlines animate in

**Tables**:
- Row highlight on hover
- Subtle background color change

## Scroll Progress

**Header Progress Bar**:
- Thin line at top of sticky header
- Fills left-to-right as user scrolls
- Color: var(--accent-primary)

**Phase Progress**:
- Vertical line on left fills as user passes phases
- Phase markers pulse when entering viewport
- Completed phases stay filled

---

# RESPONSIVE BREAKPOINTS

```css
/* Mobile */
@media (max-width: 640px) {
  --text-hero: 2.5rem;
  --text-h1: 1.75rem;
  --text-h2: 1.5rem;

  /* Stack cards vertically */
  /* Hide progress line, use simpler phase markers */
  /* Reduce padding */
}

/* Tablet */
@media (max-width: 1024px) {
  --text-hero: 3rem;

  /* 2-column grids become 1-column */
  /* Adjust spacing */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full experience */
}
```

---

# IMPLEMENTATION NOTES FOR V0

1. **Use Next.js App Router** with proper page structure
2. **Framer Motion** for all animations
3. **Tailwind CSS** for styling (map CSS variables to Tailwind config)
4. **Google Fonts**: Fraunces, DM Sans, JetBrains Mono
5. **Intersection Observer** for scroll-triggered animations
6. **Smooth scroll** behavior for internal navigation

**Component Structure**:
```
/app
  /page.tsx (landing)
  /case-study
    /selfpm
      /page.tsx
  /mission
    /page.tsx (placeholder)
/components
  /ui
    /Button
    /Card
    /Table
    /Quote
    /CalloutBox
  /layout
    /Header
    /Footer
    /ProgressLine
  /sections
    /Hero
    /PhaseBlock
    /InsightGrid
    /MetaInsight
```

---

# END OF V0 INSTRUCTIONS

This document contains everything needed to build the portfolio. Copy the entire document into v0 and it will generate the complete implementation.
