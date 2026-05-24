import { Router } from "express";
import { db } from "@workspace/db";
import {
  botConfigTable,
  activityLogTable,
  botMemoryTable,
} from "@workspace/db";
import { eq, desc, gte, and, count, sql } from "drizzle-orm";
import { botService } from "../services/bot-service";
import {
  SaveBotConfigBody,
  GetActivityQueryParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/bot/status", async (req, res) => {
  const running = botService.isRunning();
  const startedAt = botService.getStartedAt();
  const uptime = startedAt
    ? Math.floor((Date.now() - startedAt.getTime()) / 1000)
    : null;

  res.json({
    running,
    uptime,
    startedAt: startedAt?.toISOString() ?? null,
  });
});

router.post("/bot/start", async (req, res) => {
  const started = await botService.start();
  if (!started && !botService.isRunning()) {
    res.status(400).json({ error: "Bot not configured. Please set API keys first." });
    return;
  }

  const startedAt = botService.getStartedAt();
  const uptime = startedAt
    ? Math.floor((Date.now() - startedAt.getTime()) / 1000)
    : null;

  res.json({
    running: botService.isRunning(),
    uptime,
    startedAt: startedAt?.toISOString() ?? null,
  });
});

router.post("/bot/stop", async (req, res) => {
  botService.stop();
  res.json({ running: false, uptime: null, startedAt: null });
});

router.get("/bot/config", async (req, res) => {
  const [config] = await db
    .select()
    .from(botConfigTable)
    .where(eq(botConfigTable.id, 1))
    .limit(1);

  const hasXApiKey = !!config?.xApiKey;
  const hasXApiSecret = !!config?.xApiSecret;
  const hasXAccessToken = !!config?.xAccessToken;
  const hasXAccessSecret = !!config?.xAccessSecret;
  const hasOpenAiKey = !!config?.openAiKey;
  const hasXaiKey = !!config?.xaiKey;

  res.json({
    hasXApiKey,
    hasXApiSecret,
    hasXAccessToken,
    hasXAccessSecret,
    hasOpenAiKey,
    hasXaiKey,
    isConfigured:
      hasXApiKey &&
      hasXApiSecret &&
      hasXAccessToken &&
      hasXAccessSecret &&
      hasOpenAiKey &&
      hasXaiKey,
  });
});

router.put("/bot/config", async (req, res) => {
  const parsed = SaveBotConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid config data" });
    return;
  }

  const data = parsed.data;

  const existing = await db
    .select()
    .from(botConfigTable)
    .where(eq(botConfigTable.id, 1))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(botConfigTable).values({
      id: 1,
      xApiKey: data.xApiKey ?? null,
      xApiSecret: data.xApiSecret ?? null,
      xAccessToken: data.xAccessToken ?? null,
      xAccessSecret: data.xAccessSecret ?? null,
      openAiKey: data.openAiKey ?? null,
      xaiKey: data.xaiKey ?? null,
    });
  } else {
    const updateFields: Record<string, string | null> = {};
    if (data.xApiKey !== undefined) updateFields.xApiKey = data.xApiKey;
    if (data.xApiSecret !== undefined) updateFields.xApiSecret = data.xApiSecret;
    if (data.xAccessToken !== undefined) updateFields.xAccessToken = data.xAccessToken;
    if (data.xAccessSecret !== undefined) updateFields.xAccessSecret = data.xAccessSecret;
    if (data.openAiKey !== undefined) updateFields.openAiKey = data.openAiKey;
    if (data.xaiKey !== undefined) updateFields.xaiKey = data.xaiKey;

    await db
      .update(botConfigTable)
      .set({ ...updateFields, updatedAt: new Date() })
      .where(eq(botConfigTable.id, 1));
  }

  const [updated] = await db
    .select()
    .from(botConfigTable)
    .where(eq(botConfigTable.id, 1))
    .limit(1);

  res.json({
    hasXApiKey: !!updated?.xApiKey,
    hasXApiSecret: !!updated?.xApiSecret,
    hasXAccessToken: !!updated?.xAccessToken,
    hasXAccessSecret: !!updated?.xAccessSecret,
    hasOpenAiKey: !!updated?.openAiKey,
    hasXaiKey: !!updated?.xaiKey,
    isConfigured:
      !!updated?.xApiKey &&
      !!updated?.xApiSecret &&
      !!updated?.xAccessToken &&
      !!updated?.xAccessSecret &&
      !!updated?.openAiKey &&
      !!updated?.xaiKey,
  });
});

router.get("/bot/activity", async (req, res) => {
  const parsed = GetActivityQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const type = parsed.success ? parsed.data.type : undefined;

  const conditions = type
    ? and(eq(activityLogTable.type, type))
    : undefined;

  const logs = await db
    .select()
    .from(activityLogTable)
    .where(conditions)
    .orderBy(desc(activityLogTable.createdAt))
    .limit(limit);

  res.json(
    logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }))
  );
});

router.get("/bot/stats", async (req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [totalPosts] = await db
    .select({ value: count() })
    .from(activityLogTable)
    .where(eq(activityLogTable.type, "post"));

  const [totalReplies] = await db
    .select({ value: count() })
    .from(activityLogTable)
    .where(eq(activityLogTable.type, "reply"));

  const [totalInfluencer] = await db
    .select({ value: count() })
    .from(activityLogTable)
    .where(eq(activityLogTable.type, "influencer_reply"));

  const [last24hPosts] = await db
    .select({ value: count() })
    .from(activityLogTable)
    .where(
      and(
        eq(activityLogTable.type, "post"),
        gte(activityLogTable.createdAt, oneDayAgo)
      )
    );

  const [last24hReplies] = await db
    .select({ value: count() })
    .from(activityLogTable)
    .where(
      and(
        eq(activityLogTable.type, "reply"),
        gte(activityLogTable.createdAt, oneDayAgo)
      )
    );

  res.json({
    totalPosts: Number(totalPosts?.value ?? 0),
    totalReplies: Number(totalReplies?.value ?? 0),
    totalInfluencerReplies: Number(totalInfluencer?.value ?? 0),
    last24hPosts: Number(last24hPosts?.value ?? 0),
    last24hReplies: Number(last24hReplies?.value ?? 0),
  });
});

router.get("/bot/memory", async (req, res) => {
  const entries = await db
    .select()
    .from(botMemoryTable)
    .orderBy(desc(botMemoryTable.id))
    .limit(100);

  res.json(entries);
});

export default router;
