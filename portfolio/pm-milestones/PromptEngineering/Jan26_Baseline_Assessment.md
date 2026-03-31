# Prompt Engineering Assessment: Baseline
## Date: January 26, 2026
## Assessor: Claude (via SelfPM development session)

---

## Overall Score: 62/100

---

## Category Scores

| Category | Score | Notes |
|----------|-------|-------|
| Context Provision | 85/100 | Naturally provides background and motivation |
| Clarity of Ask | 55/100 | Bundles multiple questions, unclear priorities |
| Output Specification | 45/100 | Rarely specifies format, length, structure |
| Iteration/Follow-up | 80/100 | Good at asking clarifying questions |
| Scope Management | 40/100 | Uses vague words like "thorough", "brutal" |

---

## Identified Strengths

### 1. Context-Rich Requests
Naturally provides background before asking questions. Shares motivation, emotional state, and relevant history.

**Evidence**: "look, i want to become a PM very badly. I really believed i have a unique skillset..."

### 2. Structured Analysis Requests
Uses numbered questions for analytical tasks.

**Evidence**: CPO prompt with "1. What predicts... 2. Which morning... 3. What patterns..."

### 3. Iterative Clarification
Asks follow-ups when confused rather than pretending to understand.

**Evidence**: "what does it mean to push and commit changes?"

### 4. Emotional Honesty
Shares feelings which helps calibrate response tone.

---

## Identified Gaps

### 1. Bundled Requests Without Prioritization
Often includes 5-10 questions in one prompt without indicating which matters most.

**Example**: "explain architecture... give curriculum... AI/ML coaching... high-level explainer..."

### 2. Vague Scope Words
Uses undefined terms: "brutal", "thorough", "deep"

**Example**: "brutally honestly evaluate me" - unclear what "brutal" means

### 3. Missing Output Format Specifications
Rarely specifies length, structure, or format of desired response.

**Example**: "help me write a PR description" - no length, sections, or tone specified

### 4. No Success Criteria
Almost never defines what a "good" response looks like.

### 5. Implicit Assumptions
Assumes Claude has context that wasn't provided.

---

## Recommended Improvements

1. **One Clear Ask Per Prompt** - Don't bundle multiple questions
2. **Specify Output Format** - State length, structure, sections wanted
3. **Define Vague Words** - "Brutal" means what exactly?
4. **State Success Criteria** - "Good response = I can do X after"
5. **Provide Constraints** - Length limits, assumed knowledge level

---

## Checklist for Self-Evaluation

Before sending a prompt, Kaushik should check:

- [ ] Is this ONE clear ask? (not 5 bundled)
- [ ] Did I specify output FORMAT?
- [ ] Did I define vague words?
- [ ] Did I state SUCCESS CRITERIA?
- [ ] Did I provide CONSTRAINTS?
- [ ] Did I share RELEVANT CONTEXT?
- [ ] Did I PRIORITIZE if multiple questions?

---

## Sample Prompts from This Session

### Prompt 1 (Weak - Bundled)
> "Based on all the work i've done so far, can you very brutally honestly evaluate me as a product manager / designer? look through the various CPO reports... see the changelog... check subsequent reports... tell me strengths and gaps... what am i good at?... is there a world where i can translate these skills to work at anthropic?"

**Issues**: 6+ questions bundled, "brutally" undefined, no output format, no success criteria

### Prompt 2 (Moderate - Good Context, Weak Structure)
> "I really want to integrate claude API functions into SelfPM... but before that, I want to understand my current baseline on Prompt engineering. based on your assessment of my previous prompts, how good / bad am i at prompting claude?"

**Strengths**: Clear motivation, single topic area
**Issues**: No output format until edited to add "rate out of 100"

### Prompt 3 (Strong - Clear Ask)
> "can you help me write the PR description"

**Strengths**: Single clear ask
**Issues**: No format specification (worked out okay due to conventions)

---

## Metrics to Track Over Time

For future assessments, evaluate:

1. **Bundling Rate**: % of prompts with 3+ distinct questions
2. **Format Specification Rate**: % of prompts that specify output format
3. **Success Criteria Rate**: % of prompts that define what "good" looks like
4. **Vague Word Usage**: Count of undefined scope words per session
5. **Overall Score**: Weighted composite (same formula as above)

---

## Next Assessment: February 2, 2026

To trigger reassessment, say:
"Read my prompt engineering baseline at `/For SelfPM CaseStudy/KaushikPMMilestones/PromptEngineering/Jan26_Baseline_Assessment.md` and evaluate my prompts in this conversation against it."

---

*Assessment conducted: January 26, 2026*
