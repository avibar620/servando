export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api-helpers";
import { hashPassword } from "@/lib/auth";

/** Validate onboarding token */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const business = await prisma.business.findUnique({
    where: { onboardingToken: token },
    select: {
      id: true,
      name: true,
      onboardingDone: true,
    },
  });

  if (!business) return jsonError("Invalid token", 404);
  if (business.onboardingDone) return jsonError("Already completed", 410);

  return NextResponse.json({ valid: true, businessId: business.id, businessName: business.name });
}

/** Submit onboarding data */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const data = await req.json();

  const business = await prisma.business.findUnique({
    where: { onboardingToken: token },
  });

  if (!business) return jsonError("Invalid token", 404);
  if (business.onboardingDone) return jsonError("Already completed", 410);

  // Update business with onboarding data
  await prisma.business.update({
    where: { id: business.id },
    data: {
      name: data.name || business.name,
      ownerName: data.contactName || business.ownerName,
      phone: data.phone || business.phone,
      email: data.email || business.email,
      address: data.address,
      website: data.website,
      category: data.category || business.category,
      description: data.description,
      openingHours: data.openingHours,
      closedDays: data.closedDays ?? [],
      services: data.services,
      faqs: data.faq,
      fallbackNumber: data.transferNumber,
      urgentKeywords: data.urgentKeywords,
      greetingScript: data.customGreeting,
      onboardingDone: true,
      status: "ACTIVE",
      minutesTotal: data.planMinutes ?? 0,
    },
  });

  // Create client user account
  if (data.email && data.password) {
    const passwordHash = await hashPassword(data.password);
    await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.contactName || business.ownerName,
        role: "CLIENT",
        businessId: business.id,
      },
    });
  }

  return NextResponse.json({ ok: true, businessId: business.id });
}
