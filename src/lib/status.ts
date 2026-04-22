// src/lib/status.ts
//
// Field Status Logic
// ------------------
// Each field has a *computed* status derived from its stage, planting date,
// and update history. The three states are:
//
//  COMPLETED  - The field has been harvested. No further action needed.
//
//  AT_RISK    - The field needs attention. Triggered when:
//               1. The field is still PLANTED/GROWING but the planting date
//                  was more than 120 days ago (likely delayed or stagnant).
//               2. No field update has been logged in more than 21 days,
//                  suggesting the field is not being actively monitored.
//
//  ACTIVE     - The field is progressing normally within expected timelines.
//
// This logic intentionally keeps a wide AT_RISK window so coordinators
// can catch issues early. Thresholds can be tuned per crop type in future.

import { differenceInDays } from "date-fns";
import { Stage } from "@prisma/client";

export type FieldStatus = "ACTIVE" | "AT_RISK" | "COMPLETED";

export interface FieldForStatus {
  stage: Stage;
  plantingDate: Date;
  updatedAt: Date;
  updates?: { createdAt: Date }[];
}

export function computeStatus(field: FieldForStatus): FieldStatus {
  if (field.stage === Stage.HARVESTED) return "COMPLETED";

  const today = new Date();
  const daysSincePlanting = differenceInDays(today, new Date(field.plantingDate));

  // Last activity: prefer latest update, fall back to field updatedAt
  const lastUpdateDate =
    field.updates && field.updates.length > 0
      ? new Date(
          Math.max(...field.updates.map((u: any) => new Date(u.createdAt).getTime()))
        )
      : new Date(field.updatedAt);

  const daysSinceLastUpdate = differenceInDays(today, lastUpdateDate);

  const isStagnant =
    (field.stage === Stage.PLANTED || field.stage === Stage.GROWING) &&
    daysSincePlanting > 120;

  const isUnmonitored = daysSinceLastUpdate > 21;

  if (isStagnant || isUnmonitored) return "AT_RISK";

  return "ACTIVE";
}

export const STATUS_LABELS: Record<FieldStatus, string> = {
  ACTIVE: "Active",
  AT_RISK: "At Risk",
  COMPLETED: "Completed",
};

export const STAGE_ORDER: Stage[] = [
  Stage.PLANTED,
  Stage.GROWING,
  Stage.READY,
  Stage.HARVESTED,
];

export function nextStage(current: Stage): Stage | null {
  const idx = STAGE_ORDER.indexOf(current);
  return idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
}
