// src/app/(dashboard)/admin/arcships/types.ts
export interface ArcshipSummary {
    _id:          string
    name:         string
    faction?:     string   // optional
    currentSector?: string
}

