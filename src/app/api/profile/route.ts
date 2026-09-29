import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

const schema = z.object({
  name: z.string().trim().min(1).max(40),
  bio: z.string().trim().max(160).default(""),
  avatar: z
    .string()
    .max(150_000)
    .refine((v) => v === "" || v.startsWith("data:image/"), "Invalid image")
    .default(""),
});

export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile" }, { status: 400 });

  await prisma.user.update({ where: { id: userId }, data: parsed.data });
  return NextResponse.json({ ok: true });
}
