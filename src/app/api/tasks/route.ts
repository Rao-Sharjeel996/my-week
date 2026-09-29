import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

const weekRe = /^\d{4}-\d{2}-\d{2}$/;

const createSchema = z.object({
  weekStart: z.string().regex(weekRe),
  day: z.number().int().min(0).max(6),
  name: z.string().trim().min(1).max(80),
  desc: z.string().trim().max(200).default(""),
});

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, weekStart: true, day: true, name: true, desc: true, done: true },
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid task" }, { status: 400 });

  const task = await prisma.task.create({
    data: { ...parsed.data, userId },
    select: { id: true, weekStart: true, day: true, name: true, desc: true, done: true },
  });
  return NextResponse.json({ task }, { status: 201 });
}

// DELETE /api/tasks?week=YYYY-MM-DD  -> clear a whole week
export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const week = new URL(req.url).searchParams.get("week") ?? "";
  if (!weekRe.test(week)) return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  await prisma.task.deleteMany({ where: { userId, weekStart: week } });
  return NextResponse.json({ ok: true });
}
