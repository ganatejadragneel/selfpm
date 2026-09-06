// Node-only Anthropic client for the Focus dashboard (build step 4).
// Imported by the Vite dev middleware (via ssrLoadModule) and the CLI runner.
// Never imported by client code — it carries the SDK and reads the API key.

import Anthropic from '@anthropic-ai/sdk';
import { buildMessages, type FocusBox } from '../components/Focus/prompts';
import { buildSamplePayload } from '../components/Focus/payload';

// Short id → full model id. The three tiers for the model-selection harness.
export const MODELS = {
  haiku: 'claude-haiku-4-5-20251001',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-8',
} as const;

export type ModelId = keyof typeof MODELS;

export interface GenerateResult {
  box: FocusBox;
  model: ModelId;
  modelUsed: string;
  text: string;
  usage: { input_tokens: number; output_tokens: number };
  ms: number;
}

const MAX_TOKENS: Record<FocusBox, number> = {
  analysis: 450,
  'todays-focus': 300,
};

// Generic one-shot Claude call. Reused by generateFocusBox and the eval judge.
export async function callClaude(opts: {
  system?: string;
  user: string;
  model?: ModelId;
  maxTokens?: number;
  apiKey?: string;
}): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number }; modelUsed: string; ms: number }> {
  const { system, user, model = 'sonnet', maxTokens = 512, apiKey } = opts;
  const modelUsed = MODELS[model] ?? MODELS.sonnet;

  // With no explicit key the SDK resolves credentials itself: ANTHROPIC_API_KEY,
  // then ANTHROPIC_AUTH_TOKEN, then an `ant auth login` profile. That lets local
  // dev run off the signed-in profile without a key pasted into .env.local.
  const client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  const started = Date.now();
  const resp = await client.messages.create({
    model: modelUsed,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    messages: [{ role: 'user', content: user }],
  });
  const ms = Date.now() - started;

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  return {
    text,
    usage: { input_tokens: resp.usage.input_tokens, output_tokens: resp.usage.output_tokens },
    modelUsed,
    ms,
  };
}

export async function generateFocusBox(opts: {
  box: FocusBox;
  model?: ModelId;
  apiKey?: string;
  now?: Date;
}): Promise<GenerateResult> {
  const { box, model = 'sonnet', apiKey, now } = opts;
  const payload = buildSamplePayload(now);
  const { system, user } = buildMessages(box, payload);

  const r = await callClaude({ system, user, model, maxTokens: MAX_TOKENS[box], apiKey });

  return {
    box,
    model,
    modelUsed: r.modelUsed,
    text: r.text,
    usage: r.usage,
    ms: r.ms,
  };
}
