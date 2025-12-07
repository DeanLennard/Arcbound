// src/types/CharacterAssetClient.ts
import type { AssetCategory } from "@/models/CharacterAsset";

export type PowerLevel = "SPARK" | "SURGE" | "FLUX" | "BREAK" | "ASCENDANCE";

export interface CharacterAssetClient {
    _id: string;
    name: string;
    description: string;
    level: PowerLevel;
    state: "Active" | "Inactive";
    apcost: number;
    ebcost: number;
    charges?: number;
    currentCharges?: number;
    chargeInterval?: "NONE" | "PHASE" | "GAME";
    category: AssetCategory;
}
