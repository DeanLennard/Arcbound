// src/lib/formatTimestamp.ts
export function formatTimestamp(
    createdAt?: string,
    updatedAt?: string
): string {
    if (!createdAt) return 'Unknown'

    const now       = Date.now()
    const createdTs = new Date(createdAt).getTime()
    const updatedTs = updatedAt ? new Date(updatedAt).getTime() : 0

    // never negative
    const createdDiffMs = Math.max(0, now - createdTs)
    const createdAgo    = humanize(createdDiffMs)

    // if edited after creation, compute delta (clamped)
    const editDiffMs = updatedTs > createdTs
        ? Math.max(0, now - updatedTs)
        : 0

    const editedAgo = updatedTs > createdTs
        ? ` (edited ${humanize(editDiffMs)})`
        : ''

    return createdAgo + editedAgo
}

function humanize(diffMs: number): string {
    const secs = Math.floor(diffMs / 1000)
    const mins = Math.floor(diffMs / 60_000)
    const hrs  = Math.floor(diffMs / 3_600_000)

    if (mins < 1) {
        return `${secs} second${secs !== 1 ? 's' : ''} ago`
    } else if (hrs < 1) {
        return `${mins} minute${mins !== 1 ? 's' : ''} ago`
    } else if (hrs < 24) {
        return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`
    } else {
        const d    = new Date(Date.now() - diffMs)
        const day  = d.getDate()
        const mon  = d.toLocaleString('default', { month: 'short' })
        const yr   = String(d.getFullYear()).slice(-2)
        return `${day}${getSuffix(day)} ${mon} ${yr}`
    }
}

function getSuffix(day: number): string {
    if (day > 10 && day < 14) return 'th'
    switch (day % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
    }
}
