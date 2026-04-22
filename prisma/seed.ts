// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

type Stage = "PLANTED" | "GROWING" | "READY" | "HARVESTED";
const Stage = {
  PLANTED: "PLANTED" as Stage,
  GROWING: "GROWING" as Stage,
  READY: "READY" as Stage,
  HARVESTED: "HARVESTED" as Stage,
};

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@smartseason.com" },
    update: {},
    create: {
      name: "Grace Admin",
      email: "admin@smartseason.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create field agents
  const agent1Password = await bcrypt.hash("agent123", 12);
  const agent1 = await prisma.user.upsert({
    where: { email: "john@smartseason.com" },
    update: {},
    create: {
      name: "John Kamau",
      email: "john@smartseason.com",
      password: agent1Password,
      role: "AGENT",
    },
  });

  const agent2 = await prisma.user.upsert({
    where: { email: "mary@smartseason.com" },
    update: {},
    create: {
      name: "Mary Wanjiru",
      email: "mary@smartseason.com",
      password: agent1Password,
      role: "AGENT",
    },
  });

  // Create fields
  const fields = [
    {
      name: "Kiambu North Plot A",
      cropType: "Maize",
      plantingDate: new Date("2026-01-15"),
      stage: Stage.GROWING,
      location: "Kiambu, Kenya",
      areaAcres: 5.2,
      agentId: agent1.id,
    },
    {
      name: "Thika Road East",
      cropType: "Beans",
      plantingDate: new Date("2026-02-01"),
      stage: Stage.PLANTED,
      location: "Thika, Kenya",
      areaAcres: 3.0,
      agentId: agent1.id,
    },
    {
      name: "Limuru Highland Field",
      cropType: "Irish Potatoes",
      plantingDate: new Date("2025-11-10"),
      stage: Stage.HARVESTED,
      location: "Limuru, Kenya",
      areaAcres: 8.0,
      agentId: agent2.id,
    },
    {
      name: "Nakuru Basin Plot",
      cropType: "Wheat",
      plantingDate: new Date("2025-12-01"),
      stage: Stage.READY,
      location: "Nakuru, Kenya",
      areaAcres: 12.5,
      agentId: agent2.id,
    },
    {
      name: "Rift Valley Demo Field",
      cropType: "Sunflower",
      plantingDate: new Date("2025-10-01"),
      stage: Stage.GROWING,
      location: "Rift Valley, Kenya",
      areaAcres: 6.0,
      agentId: agent1.id,
    },
  ];

  for (const fieldData of fields) {
    const existing = await prisma.field.findFirst({ where: { name: fieldData.name } });
    if (!existing) {
      const field = await prisma.field.create({ data: fieldData });
      // Add an initial update
      await prisma.fieldUpdate.create({
        data: {
          fieldId: field.id,
          stage: fieldData.stage,
          notes: `Initial observation recorded. Field looks ${fieldData.stage === Stage.HARVESTED ? "ready for harvest rotation" : "healthy and on track"}.`,
          authorId: fieldData.agentId,
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  Admin   → admin@smartseason.com / admin123");
  console.log("  Agent 1 → john@smartseason.com  / agent123");
  console.log("  Agent 2 → mary@smartseason.com  / agent123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
