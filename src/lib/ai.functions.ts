import { createServerFn } from "@tanstack/react-start";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key)(MODEL);
}

// ---------- Email Generator ----------
const EmailInput = z.object({
  purpose: z.string().min(1),
  recipient: z.enum(["Client", "Manager", "Team Member"]),
  tone: z.enum(["Formal", "Friendly", "Persuasive", "Professional"]),
  details: z.string().min(1),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => EmailInput.parse(data))
  .handler(async ({ data }) => {
    const prompt = `You are an expert business communication assistant.

Generate a professional email based on:
- Recipient Type: ${data.recipient}
- Tone: ${data.tone}
- Purpose: ${data.purpose}
- Key Information: ${data.details}

Respond in this exact format using these section headers on their own line:
SUBJECT: <one-line subject>
EMAIL:
<the full email body, including greeting and sign-off>
CTA: <a single suggested call-to-action sentence>`;

    const { text } = await generateText({ model: getModel(), prompt });

    const subjectMatch = text.match(/SUBJECT:\s*(.+)/i);
    const ctaMatch = text.match(/CTA:\s*([\s\S]+)/i);
    const emailMatch = text.match(/EMAIL:\s*([\s\S]+?)(?=\nCTA:|$)/i);

    return {
      subject: subjectMatch?.[1]?.trim() ?? "",
      email: emailMatch?.[1]?.trim() ?? text,
      cta: ctaMatch?.[1]?.trim() ?? "",
      raw: text,
    };
  });

// ---------- Meeting Summarizer ----------
const MeetingInput = z.object({ notes: z.string().min(10) });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => MeetingInput.parse(data))
  .handler(async ({ data }) => {
    const prompt = `You are an executive meeting assistant.

Analyze the meeting notes and provide a structured response in markdown with these exact section headings:

## Executive Summary
(2-3 sentences)

## Key Discussion Points
(bulleted list)

## Decisions Made
(bulleted list)

## Action Items
(bulleted list — each item formatted as: **Task** — Owner: <name> — Deadline: <date or TBD>)

## Deadlines
(bulleted list of all deadlines mentioned)

## Risks or Concerns
(bulleted list; write "None identified" if no risks)

Meeting Notes:
${data.notes}`;

    const { text } = await generateText({ model: getModel(), prompt });
    return { markdown: text };
  });

// ---------- Task Planner ----------
const Task = z.object({
  name: z.string(),
  dueDate: z.string(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]),
  durationHours: z.number(),
});
const TasksInput = z.object({ tasks: z.array(Task).min(1) });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => TasksInput.parse(data))
  .handler(async ({ data }) => {
    const taskList = data.tasks
      .map(
        (t, i) =>
          `${i + 1}. ${t.name} — due ${t.dueDate} — priority ${t.priority} — est ${t.durationHours}h`,
      )
      .join("\n");

    const prompt = `You are a productivity and time management expert.

Analyze the following tasks and create a structured markdown response with these exact sections:

## Priority Ranking
(numbered list of tasks in optimal order with one-line rationale each)

## Daily Schedule
(today's recommended time blocks in a table or bulleted list with time ranges)

## Weekly Schedule
(day-by-day plan Mon-Sun)

## Time Optimization Suggestions
(bulleted list)

## Productivity Recommendations
(bulleted list of 3-5 actionable tips)

Tasks:
${taskList}`;

    const { text } = await generateText({ model: getModel(), prompt });
    return { markdown: text };
  });

// ---------- Chat ----------
const ChatInput = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ChatInput.parse(data))
  .handler(async ({ data }) => {
    const systemMsg: ModelMessage = {
      role: "system",
      content:
        "You are WorkMate AI, a helpful workplace productivity assistant. Help users with workplace questions, planning, content generation, summarization, and productivity advice. Keep responses concise, practical, and professional. Use markdown formatting when helpful (lists, bold, headings).",
    };
    const { text } = await generateText({
      model: getModel(),
      messages: [systemMsg, ...(data.messages as ModelMessage[])],
    });
    return { text };
  });
