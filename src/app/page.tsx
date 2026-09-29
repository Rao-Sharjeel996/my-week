import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WeekApp from "@/components/WeekApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, weekStart: true, day: true, name: true, desc: true, done: true },
  });

  return (
    <WeekApp
      initialTasks={tasks}
      initialUser={{ name: user.name, email: user.email, bio: user.bio, avatar: user.avatar }}
    />
  );
}
