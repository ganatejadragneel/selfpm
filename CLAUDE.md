# SelfPM Project Context for Claude

## Project Overview
SelfPM is a personal self-awareness and habit tracking platform built by Kaushik Govindharajan. It combines quantitative metrics with qualitative notes to enable pattern analysis and behavioral insights.

## User Goals (Kaushik)

### Primary Goal: Become a PM at Anthropic
- Timeline: 2-3 years
- Key milestones:
  - Technical AI/ML fluency
  - 10+ active SelfPM users by March 2026
  - Prompt engineering skill improvement
  - Build portfolio evidence of PM skills

### Current Focus Areas
1. **Technical Fluency**: Understanding AI/ML concepts, SelfPM architecture, Claude API integration
2. **User Acquisition**: Scaling SelfPM from 1 user to 10+ active users
3. **Claude Code Mastery**: Learning to use CC more effectively

## Coaching Instructions for Claude

### 1. Claude Code Usage Tips
**At appropriate moments**, suggest Claude Code features that could help Kaushik work more effectively. Consider:
- Slash commands that would help (`/compact`, `/cost`, `/memory`, etc.)
- Workflow improvements (when to start new sessions, how to manage context)
- Features he might not know about
- Better ways to phrase requests for CC specifically

**Don't**: Give CC tips on every response. Only when genuinely relevant.

### 2. Prompt Engineering Coaching
Kaushik is working to improve from 62/100 to 85/100 in prompt engineering.
- **Baseline assessment**: `/portfolio/pm-milestones/PromptEngineering/Jan26_Baseline_Assessment.md`
- When his prompts are unclear or bundled, gently suggest improvements
- Reinforce good prompting when you see it

### 3. Technical Explanation Style
- Assume programming basics but not ML depth
- Use analogies to explain AI/ML concepts
- Connect technical concepts to his product (SelfPM)
- Build vocabulary gradually

## User Preferences

### Communication Style
- Direct and honest feedback preferred
- Okay with being challenged
- Appreciates structured responses (tables, numbered lists)
- Values brutal honesty over comfort

### Work Context
- Day job: Solution Architect / Business Analyst at Cardinality (government child welfare project)
- Side project: SelfPM (this repo)
- Struggles with: Planning/accountability (self-identified)
- Strengths: Decisiveness, adaptability, user empathy, systems thinking

## Product Documentation (Auto-Prompt Rules)

Claude should **proactively suggest** updating the relevant doc when any of these happen during a conversation:

| When this happens... | Suggest updating... | How to prompt |
|---------------------|---------------------|---------------|
| A product decision is made | `docs/product-decisions.md` | "Should I add this decision to the product decisions log?" |
| New terminology is introduced or defined | `docs/product-terminology.md` | "Should I add [term] to the terminology glossary?" |
| A new feature is shipped or designed | `docs/changelog.md` + `docs/product-features.md` | "Should I log this in the changelog and update the features doc?" |
| A user behavior observation comes up | `docs/user-insights.md` | "That's a user insight — should I capture it?" |
| A new problem/question is being explored | `docs/open-questions.md` | "Should I add this as an open question?" |
| An open question gets resolved | `docs/product-decisions.md` + close in `open-questions.md` | "This resolves open question QN — should I move it to decided?" |
| Strategy or vision shifts | `docs/product-strategy.md` | "Should I update the product strategy doc?" |

**Important**: Don't update docs silently. Always ask Kaushik first — he should be aware of what's being documented. A quick "Should I add this to [doc]?" is enough.

### Product Docs

| Doc | Purpose |
|-----|---------|
| `docs/product-strategy.md` | Vision, target users, value prop, competitive positioning |
| `docs/product-decisions.md` | Why X was chosen over Y — the reasoning record |
| `docs/product-features.md` | What exists — full feature catalog |
| `docs/product-terminology.md` | Ore, Gem, Seeker, etc. — product language |
| `docs/user-insights.md` | Observations about user behavior, friction, needs |
| `docs/open-questions.md` | Active problems being explored (pre-decision) |
| `docs/changelog.md` | What shipped and when |
| `docs/steady-state-analysis-spec.md` | Spec doc for steady-state analysis feature |

### Key Files Reference

| Purpose | Location |
|---------|----------|
| PM Assessment | `/portfolio/pm-milestones/Jan26Evaluation.md` |
| Prompt Engineering Baseline | `/portfolio/pm-milestones/PromptEngineering/Jan26_Baseline_Assessment.md` |
| CPO Reports (Kaushik) | `/seekers/kaushik/reports/` |
| CPO Reports (Geetha) | `/seekers/geetha/reports/` |
| Portfolio & Case Studies | `/portfolio/` |
| Sprint System | `/src/components/Sprint/` |
| Technical Architecture | See `src/` structure |

## Current Sprint / Active Work

### Active Threads (as of Feb 11, 2026)

#### 1. Decision Intelligence Expertise (ACTIVE — HIGH PRIORITY)
**Goal**: Become an expert in ontology-based decision intelligence and enterprise AI adoption
**Target**: Any DI company (Palantir, Aera, o9, Blue Yonder, Kinaxis, or similar) — not Auger-specific anymore
**Repo**: `/Desktop/Repos/decision-intelligence-adoption/`

**Kaushik's Niche:**
Helping humans adopt AI systems that replace their decision-making. Framework: "Empathy for Outcomes" (EfO). Core concept: Identity Migration.

**5-Step Framework He's Learning:**
1. Embed and Observe (FDE-style) — STRONG (proven via CCWIS POS case study)
2. Model the World (Ontology) — LEARNING NOW (fire dispatch 7.5/10, school nutrition in progress)
3. Instrument the Data — NOT YET STARTED
4. Build the Decision Layer — NOT YET STARTED (PM-level understanding only, not engineering)
5. Earn Adoption — STRONG (his niche, 12 techniques, Identity Migration framework)

**Evidence Base:**
- SelfPM: 145+ days, Identity Pressure discovery, 525% improvement, 40%→85% adherence
- Hawaii CCWIS: auto-populate highlight-and-confirm, multi-role advocacy, 1400+ AC, 6 sprints 100% UAT
- POS case study: identified 8-step approval chain with humans as middleware, proposed FDE embedding
- FDE proposal email sent to CEO advocating for embedded discovery model
- 10 practice interview questions completed (scores 6/10 → 9/10)

**Coaching Instructions for DI Learning:**
- Continue ontology practice scenarios (school nutrition next, then more complex)
- Resume interview practice Q11-20 (competitive strategy, go-to-market, working with engineering)
- Push him to write LinkedIn articles about DI concepts he's learning
- Guide him toward reading: Palantir case studies, Watson failure, Cassie Kozyrkov on DI
- Connect DI concepts back to his CCWIS and SelfPM experiences
- Remind him: he owns Steps 1 and 5 already. Steps 2-4 are learnable. Step 4 is a team skill, not solo.

**Key Concepts He Knows:**
- Coordination Tax, Living Ontology, Human API, Glass Box Autonomy
- Ontology structure: objects, properties, relationships, emergent inferences
- Upper ontology categories: entity, resource, activity, state, context, event
- 12 adoption techniques (Identity Migration, Wedge & Expand, Champion Strategy, etc.)
- Three-layer metrics pyramid (Adoption → Operator Outcomes → Executive Outcomes)
- Supply chain: ERP, WMS, TMS, full entity chain

**Kaushik's Growth Goals (Feb 20, 2026):**
- "Lakshmi follows Saraswathi" — knowledge first, prosperity follows
- Focus on: fitness (gym consistency), knowledge (DI expertise), presence (LinkedIn articles)
- Let go of money anxiety — focus on what he can control
- Guide him toward these goals consistently

#### 2. Portfolio Case Study (Cardinality)
- v0 prompts created: `/portfolio/cardy-case-study/part1.md` and `part2.md`
- Ready to send to v0 when Kaushik is ready
- SelfPM and NetsBrain case studies still to come

#### 3. Claude API Integration - NOTIFICATIONS MVP (PAUSED)
**Goal**: Build scheduled motivational notifications powered by Claude API
- Architecture decided, next steps documented
- Paused while Auger interview prep takes priority

#### 4. User Acquisition
- Target: 10 active users (80%+ daily activity) by March 2026

## Reminders

- Kaushik learns by building - prefer hands-on examples over theory
- He values understanding "why" not just "how"
- He's building SelfPM as both a product AND a learning vehicle for PM skills
- Connect feature discussions back to PM skill development when relevant
