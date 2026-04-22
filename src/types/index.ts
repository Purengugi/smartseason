// src/types/index.ts

export type FieldStatus = "ACTIVE" | "AT_RISK" | "COMPLETED";
export type Stage = "PLANTED" | "GROWING" | "READY" | "HARVESTED";
export type Role = "ADMIN" | "AGENT";

export interface FieldWithRelations {
  id: string;
  name: string;
  cropType: string;
  plantingDate: Date;
  stage: Stage;
  location: string | null;
  areaAcres: number | null;
  agentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  agent: { id: string; name: string; email: string } | null;
  updates: {
    id: string;
    stage: Stage;
    notes: string | null;
    createdAt: Date;
    author: { name: string };
  }[];
  status: FieldStatus;
}

export interface UserSafe {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}
