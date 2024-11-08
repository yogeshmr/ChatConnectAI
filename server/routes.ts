import { type Express } from "express";
import { setupAuth } from "./auth";
import { db } from "db";
import { conversations, messages } from "db/schema";
import { eq } from "drizzle-orm";
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
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
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
