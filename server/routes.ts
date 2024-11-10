import { type Express } from "express";
import { setupAuth } from "./auth";
import { db } from "db";
import { conversations, messages } from "db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { openai } from "./openai";

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Get all conversations for the current user
  app.get("/api/conversations", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userConversations = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, req.user.id))
      .orderBy(conversations.createdAt);

    res.json(userConversations);
  });

  // Create a new conversation
  app.post("/api/conversations", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [conversation] = await db
      .insert(conversations)
      .values({
        title: "New Conversation",
        userId: req.user.id,
      })
      .returning();

    res.json(conversation);
  });

  // Update a conversation
  app.patch("/api/conversations/:id", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, starred, archived } = req.body;
    const conversationId = parseInt(req.params.id);

    const [conversation] = await db
      .update(conversations)
      .set({ 
        ...(title && { title }),
        ...(starred !== undefined && { starred }),
        ...(archived !== undefined && { archived }),
        lastActive: new Date(),
      })
      .where(eq(conversations.id, conversationId))
      .returning();

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversation);
  });

  // Delete conversations (single or bulk)
  app.delete("/api/conversations", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { ids } = req.body;
    const conversationIds = Array.isArray(ids) ? ids : [ids];

    await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.userId, req.user.id),
          inArray(conversations.id, conversationIds)
        )
      );

    res.status(204).end();
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, parseInt(req.params.id)))
      .orderBy(messages.createdAt);

    res.json(conversationMessages);
  });

  // Send a message in a conversation
  app.post("/api/conversations/:id/messages", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content } = req.body;
    const conversationId = parseInt(req.params.id);

    // Update conversation's lastActive timestamp
    await db
      .update(conversations)
      .set({ lastActive: new Date() })
      .where(eq(conversations.id, conversationId));

    // Save user message
    const [userMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        role: "user",
        content,
      })
      .returning();

    // Get OpenAI response
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content }],
    });

    // Save assistant message
    const [assistantMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        role: "assistant",
        content: completion.choices[0].message.content || "",
      })
      .returning();

    res.json([userMessage, assistantMessage]);
  });
}
