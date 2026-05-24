import { TwitterApi } from "twitter-api-v2";
import OpenAI from "openai";
import { db } from "@workspace/db";
import {
  botConfigTable,
  activityLogTable,
  botMemoryTable,
} from "@workspace/db";
import { eq, desc, gte, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const SYSTEM_PROMPT = `You are the official Nexus Trade AI assistant.

Tone:
- Smart
- Calm
- Professional
- Human-like

Rules:
- No guaranteed profits
- No hype or spam tone
- Never reveal internal systems
- Keep replies under 240 characters

Nexus Trade:
- 24/7 automated Solana trading platform
- Uses EMA, RSI, volume signals
- Server-side execution
- Users control deposits/withdrawals
- https://nexustrades99.netlify.app`;

const BLOCKED_TOPICS = [
  "admin key",
  "private key",
  "seed phrase",
  "backend",
  "server",
  "rpc",
  "exploit",
  "hack",
  "database",
];

const BANNED_PHRASES = [
  "guaranteed profit",
  "risk free",
  "100% return",
  "double your money",
];

const SAFE_RESPONSES = [
  "I can't share internal system details, but I can explain how Nexus Trade works.",
  "For security reasons, internal details aren't public. Happy to explain the platform.",
];

const TRUST_RESPONSES = [
  "Nexus Trade uses dedicated wallets. You can deposit and withdraw anytime.",
  "Funds stay in your assigned trading wallet. The system automates execution only.",
  "It's built for consistent execution, not guarantees.",
];

const POST_TOPICS = [
  "automation in trading",
  "trading mistakes",
  "execution speed",
  "risk management",
  "manual vs automated trading",
  "how Nexus Trade works",
];

const INFLUENCERS = ["solana", "phantom", "coingecko"];
const VIRAL_STYLES = ["insight", "contrarian", "agree", "question"];

function isSensitive(text: string): boolean {
  return BLOCKED_TOPICS.some((x) => text.toLowerCase().includes(x));
}

function getSafeResponse(): string {
  return SAFE_RESPONSES[Math.floor(Math.random() * SAFE_RESPONSES.length)];
}

function cleanResponse(text: string): string {
  if (BANNED_PHRASES.some((p) => text.toLowerCase().includes(p))) {
    return "Nexus Trade focuses on automation and efficiency. Always trade responsibly.";
  }
  return text;
}

function formatResponse(text: string): string {
  return text.slice(0, 240);
}

function detectIntent(text: string): "high" | "trust" | "low" {
  const t = text.toLowerCase();
  if (["how do i", "start", "join", "link", "sign up"].some((x) => t.includes(x))) return "high";
  if (["safe", "legit", "real", "scam"].some((x) => t.includes(x))) return "trust";
  return "low";
}

function buildViralPrompt(tweetText: string): string {
  const style = VIRAL_STYLES[Math.floor(Math.random() * VIRAL_STYLES.length)];
  if (style === "insight") return `Give a sharp insight on: ${tweetText}`;
  if (style === "contrarian") return `Give a respectful contrarian take on: ${tweetText}`;
  if (style === "agree") return `Agree but add depth: ${tweetText}`;
  return `Ask a smart question about: ${tweetText}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface BotClients {
  twitter: TwitterApi;
  openai: OpenAI;
  grok: OpenAI;
}

async function loadClients(): Promise<BotClients | null> {
  const [config] = await db
    .select()
    .from(botConfigTable)
    .where(eq(botConfigTable.id, 1))
    .limit(1);

  if (
    !config ||
    !config.xApiKey ||
    !config.xApiSecret ||
    !config.xAccessToken ||
    !config.xAccessSecret ||
    !config.openAiKey ||
    !config.xaiKey
  ) {
    return null;
  }

  const twitter = new TwitterApi({
    appKey: config.xApiKey,
    appSecret: config.xApiSecret,
    accessToken: config.xAccessToken,
    accessSecret: config.xAccessSecret,
  });

  const openai = new OpenAI({ apiKey: config.openAiKey });
  const grok = new OpenAI({
    apiKey: config.xaiKey,
    baseURL: "https://api.x.ai/v1",
  });

  return { twitter, openai, grok };
}

async function generateText(
  clients: BotClients,
  prompt: string,
  isPost = false
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];

  try {
    if (isPost) {
      const res = await clients.grok.chat.completions.create({
        model: "grok-3",
        messages,
      });
      return res.choices[0].message.content?.trim() ?? "";
    }
    const res = await clients.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    return res.choices[0].message.content?.trim() ?? "";
  } catch {
    const res = await clients.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    return res.choices[0].message.content?.trim() ?? "";
  }
}

async function logActivity(
  type: "post" | "reply" | "influencer_reply",
  content: string,
  success: boolean,
  targetUser?: string,
  tweetId?: string
) {
  try {
    await db.insert(activityLogTable).values({
      type,
      content,
      success,
      targetUser: targetUser ?? null,
      tweetId: tweetId ?? null,
    });
  } catch (err) {
    logger.error({ err }, "Failed to log activity");
  }
}

async function saveMemory(user: string, question: string, answer: string) {
  try {
    await db.insert(botMemoryTable).values({ user, question, answer });
  } catch (err) {
    logger.error({ err }, "Failed to save memory");
  }
}

class BotService {
  private running = false;
  private startedAt: Date | null = null;
  private intervals: ReturnType<typeof setInterval>[] = [];
  private repliedIds = new Set<string>();
  private repliedInfluencerIds = new Set<string>();

  isRunning(): boolean {
    return this.running;
  }

  getStartedAt(): Date | null {
    return this.startedAt;
  }

  async start(): Promise<boolean> {
    if (this.running) return false;

    const clients = await loadClients();
    if (!clients) {
      logger.warn("Cannot start bot: missing configuration");
      return false;
    }

    this.running = true;
    this.startedAt = new Date();

    const postInterval = setInterval(async () => {
      await this.postTweet(clients);
    }, 4 * 60 * 60 * 1000);

    const mentionInterval = setInterval(async () => {
      await this.replyMentions(clients);
    }, 3 * 60 * 1000);

    const influencerInterval = setInterval(async () => {
      await this.replyToInfluencers(clients);
    }, 10 * 60 * 1000);

    this.intervals = [postInterval, mentionInterval, influencerInterval];

    logger.info("Bot started");
    return true;
  }

  stop(): boolean {
    if (!this.running) return false;
    this.intervals.forEach((i) => clearInterval(i));
    this.intervals = [];
    this.running = false;
    this.startedAt = null;
    logger.info("Bot stopped");
    return true;
  }

  private async postTweet(clients: BotClients) {
    const topic = POST_TOPICS[Math.floor(Math.random() * POST_TOPICS.length)];
    const prompt = `Write a sharp X post about ${topic}. Mention Nexus Trade naturally. Keep under 200 characters.`;

    try {
      const tweet = await generateText(clients, prompt, true);
      await clients.twitter.v2.tweet(tweet);
      await logActivity("post", tweet, true);
      logger.info({ tweet }, "Posted tweet");
    } catch (err) {
      logger.error({ err }, "Failed to post tweet");
      await logActivity("post", `Failed: ${String(err)}`, false);
    }
  }

  private async replyMentions(clients: BotClients) {
    try {
      const me = await clients.twitter.v2.me();
      const mentions = await clients.twitter.v2.userMentionTimeline(me.data.id, {
        max_results: 10,
        expansions: ["author_id"],
      });

      for (const mention of mentions.data?.data ?? []) {
        if (this.repliedIds.has(mention.id)) continue;

        const user = mention.author_id ?? "unknown";
        const text = mention.text;
        let reply: string;

        if (isSensitive(text)) {
          reply = getSafeResponse();
        } else {
          const intent = detectIntent(text);
          if (intent === "trust") {
            reply = TRUST_RESPONSES[Math.floor(Math.random() * TRUST_RESPONSES.length)];
          } else if (intent === "high") {
            reply = "You can start here: https://nexustrades99.netlify.app — automated trading running 24/7.";
          } else {
            const raw = await generateText(clients, `Reply naturally to: ${text}`);
            reply = cleanResponse(raw);
            await saveMemory(user, text, reply);
          }
        }

        reply = formatResponse(reply);

        await clients.twitter.v2.reply(reply, mention.id);
        this.repliedIds.add(mention.id);
        await logActivity("reply", reply, true, user, mention.id);
        logger.info({ user, reply }, "Replied to mention");

        await sleep(randomInt(40000, 120000));
      }
    } catch (err) {
      logger.error({ err }, "Failed to process mentions");
    }
  }

  private async replyToInfluencers(clients: BotClients) {
    for (const username of INFLUENCERS) {
      try {
        const user = await clients.twitter.v2.userByUsername(username);
        if (!user.data) continue;

        const tweets = await clients.twitter.v2.userTimeline(user.data.id, {
          max_results: 5,
        });

        for (const tweet of tweets.data?.data ?? []) {
          if (this.repliedInfluencerIds.has(tweet.id)) continue;

          const isHighValue =
            (tweet.public_metrics?.like_count ?? 0) > 5 ||
            (tweet.public_metrics?.retweet_count ?? 0) > 2 ||
            tweet.text.includes("?");

          if (!isHighValue || Math.random() > 0.5) continue;

          const prompt = buildViralPrompt(tweet.text);
          let reply = await generateText(clients, prompt);
          reply = cleanResponse(reply);

          if (Math.random() < 0.2) {
            reply += " Execution consistency is where automation helps.";
          }

          reply = formatResponse(reply);

          await clients.twitter.v2.reply(reply, tweet.id);
          this.repliedInfluencerIds.add(tweet.id);
          await logActivity("influencer_reply", reply, true, username, tweet.id);
          logger.info({ username, reply }, "Replied to influencer");

          await sleep(randomInt(60000, 180000));
        }
      } catch (err) {
        logger.error({ err, username }, "Failed to reply to influencer");
      }
    }
  }
}

export const botService = new BotService();
