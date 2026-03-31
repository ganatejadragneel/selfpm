# SelfPM Product Deep-Dive: 7-Day Sprint

**Created:** February 1, 2026
**Purpose:** Structured product thinking exercises to prepare for Anthropic/PM interviews
**Format:** 1 question per day, 90-120 minutes, written deliverable

---

## How to Use This

- **1 question per day** (some are meaty)
- **Target: 90-120 minutes per question**
- **Output: 1-2 page written answer** (this becomes your interview prep doc)
- **Format: Write as if explaining to a senior PM at Anthropic
- **Save responses to:** `Product_Deep_Dive/Responses/` folder

---

## Sprint Schedule

| Day | Date | Question | Focus Area |
|-----|------|----------|------------|
| 1 | Sun Feb 2 | Problem Statement | Problem Discovery |
| 2 | Mon Feb 3 | Critical Design Choices | Trade-offs |
| 3 | Tue Feb 4 | Sprint Feature Deep-Dive | Feature Design |
| 4 | Wed Feb 5 | Metrics & Measurement | Quantitative Thinking |
| 5 | Thu Feb 6 | What You Got Wrong | Learning & Iteration |
| 6 | Fri Feb 7 | Claude Integration | AI/LLM Thinking |
| 7 | Sat Feb 8 | Vision & Roadmap | Product Vision |

---

## Day 1: Problem Discovery & User Empathy

### Question 1: The Problem Statement

*"Walk me through the problem SelfPM solves. What was broken before? What did you try before building it? Why did those solutions fail? And how do you know this is a real problem vs. a solution looking for a problem?"*

**What they're evaluating:**
- Can you articulate a problem crisply?
- Did you validate the problem before building?
- Do you understand the difference between symptoms and root causes?

**Your deliverable:** A 1-page problem statement that includes:
- The core pain point (in one sentence)
- What you tried before SelfPM (other apps, journaling, etc.)
- Why those failed (specific failure modes)
- Evidence that this problem is real (your own data, patterns)

---

## Day 2: Product Decisions & Trade-offs

### Question 2: The Critical Design Choices

*"What were the 3 most important product decisions you made in SelfPM? For each, what alternatives did you consider, and why did you choose what you chose? What did you sacrifice?"*

**What they're evaluating:**
- Do you think in trade-offs?
- Can you articulate why you chose X over Y?
- Do you understand opportunity cost?

**Your deliverable:** For each of 3 decisions, write:
- The decision
- 2-3 alternatives you considered
- Why you chose what you chose
- What you gave up (the trade-off)

*Examples to consider: Daily tasks vs. Sprint metrics, note-taking vs. structured fields, mobile vs. web, complexity of tracking vs. simplicity, etc.*

---

## Day 3: The Sprint Feature Deep-Dive

### Question 3: Feature Rationale

*"You built a Sprint Focus System. Explain the user problem it solves, how you designed it, and what success looks like. Walk me through one user (yourself) going from problem → using the feature → outcome."*

**What they're evaluating:**
- Can you connect feature to user need?
- Do you understand the full user journey?
- Can you measure success?

**Your deliverable:**
- The problem Sprint solves (that daily tracking didn't)
- The key design decisions in Sprint (weekly targets, metric types, notes)
- A concrete user story: "Before Sprint, I was... Now with Sprint, I..."
- How you'd measure if Sprint is working (your own metrics)

---

## Day 4: Metrics & Measurement

### Question 4: How Do You Know It's Working?

*"If SelfPM had 1,000 users tomorrow, what metrics would you track to know if the product is successful? Define your North Star metric and 3 supporting metrics. How would you instrument them?"*

**What they're evaluating:**
- Do you think quantitatively about product success?
- Can you distinguish vanity metrics from meaningful ones?
- Do you understand the metrics hierarchy?

**Your deliverable:**
- North Star metric (the one number that matters most) + why
- 3 supporting metrics + what each tells you
- Leading vs. lagging indicators
- How you'd actually measure these (what data you'd capture)

---

## Day 5: Iteration & Learning

### Question 5: What Did You Get Wrong?

*"What's a feature or decision in SelfPM that you got wrong? How did you discover it was wrong? What did you learn, and what did you change?"*

**What they're evaluating:**
- Are you honest about failures?
- Do you learn from mistakes?
- Can you iterate based on evidence?

**Your deliverable:**
- One concrete thing you got wrong
- How you discovered it (data, user feedback, intuition)
- What you learned
- What you changed (or would change)

*Hint: You have 5 months of CPO reports documenting exactly this.*

---

## Day 6: AI/LLM Integration Thinking

### Question 6: The Claude Integration

*"You're planning to integrate Claude API into SelfPM. What specific user problems would AI solve that the current product can't? Design one AI-powered feature: what's the input, what does Claude do, what's the output, and why is this better than non-AI alternatives?"*

**What they're evaluating:**
- Do you understand where AI adds value vs. where it doesn't?
- Can you design AI features that solve real problems?
- Do you understand the build vs. buy trade-offs?

**Your deliverable:**
- 2-3 user problems AI could solve in SelfPM
- One detailed feature design:
  - User trigger (when does this activate?)
  - Input to Claude (what context does it need?)
  - Claude's job (what is it doing?)
  - Output to user (what do they see?)
  - Why AI is necessary (why not rules-based?)

*This is directly relevant to Anthropic's interests.*

---

## Day 7: Vision & Roadmap

### Question 7: The Future of SelfPM

*"It's one year from now. SelfPM has 10,000 active users. What does the product look like? What features exist that don't exist today? What's your roadmap to get there, and how do you prioritize?"*

**What they're evaluating:**
- Can you think beyond the current state?
- Do you have product vision?
- Can you prioritize ruthlessly?

**Your deliverable:**
- The 1-year vision (2-3 sentences)
- 5 features that would exist
- Prioritized roadmap (what you'd build in what order)
- Your prioritization framework (how did you decide the order?)

---

## Bonus Questions (If You Finish Early)

### Question 8: Competitive Landscape
*"What are SelfPM's competitors? Why would someone choose SelfPM over them? What's your unfair advantage?"*

### Question 9: The Hardest Technical Decision
*"What was the hardest technical decision you made in SelfPM? How did you approach it? What would you do differently?"*

### Question 10: Scaling Yourself Out
*"SelfPM was built for you. How do you make it work for users who aren't you? What assumptions are baked in that wouldn't apply to others?"*

---

## Why This Works

1. **Defined**: Each question has a clear deliverable
2. **Bounded**: 90-120 minutes, then done
3. **Cumulative**: By day 7, you have a 10+ page product document
4. **Interview-ready**: These ARE the questions you'll be asked
5. **Forces depth**: You can't answer these superficially

---

## End State

By Feb 8, you'll have a complete product portfolio document that:
- Demonstrates your thinking
- Prepares you for interviews
- Forces you to understand your own product deeply

Save your responses in the `Responses/` subfolder as:
- `Day1_Problem_Statement.md`
- `Day2_Design_Choices.md`
- etc.

---

*Questions designed by Claude, based on Anthropic PM interview patterns and product thinking frameworks.*
