export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/api-helpers";
import { randomBytes } from "crypto";

/** Admin: create a new business with onboarding token */
export async function POST(req: Request) {
  const { error } = await auth("ADMIN");
  if (error) return error;

  const data = await req.json();
  const token = randomBytes(16).toString("hex");

  // Find the default plan
  const plan = await prisma.plan.findFirst({ where: { slug: data.planSlug ?? "GROWTH" } });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 400 });
  }

  const business = await prisma.business.create({
    data: {
      name: data.name || "עסק חדש",
      ownerName: data.ownerName || "",
      phone: data.phone || "",
      email: data.email || "",
      category: data.category || "אחר",
      planId: plan.id,
      onboardingToken: token,
      minutesTotal: plan.minutes,
    },
  });

  return NextResponse.json({
    token,
    businessId: business.id,
    onboardingUrl: `/onboarding/${token}`,
  }, { status: 201 });
}
