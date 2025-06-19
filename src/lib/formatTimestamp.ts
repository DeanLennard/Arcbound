// src/lib/formatTimestamp.ts
export function formatTimestamp(
    createdAt?: string,
    updatedAt?: string
): string {
    if (!createdAt) return 'Unknown'

    const now       = Date.now()
    const createdTs = new Date(createdAt).getTime()
    const updatedTs = updatedAt ? new Date(updatedAt).getTime() : 0

    // clamp so we never go negative
    const createdDiffMs = Math.max(0, now - createdTs)
    const createdAgo    = humanize(createdDiffMs)

    // only show an “edited” tag if updatedAt really is after createdAt,
    // and it was at least 1 minute ago
    const editDiffMs = updatedTs > createdTs
        ? now - updatedTs
        : 0

    const editedAgo =
        updatedTs > createdTs && editDiffMs >= 60_000
            ? ` (edited ${humanize(editDiffMs)})`
            : ''

    return createdAgo + editedAgo
}

function humanize(diffMs: number): string {
    const mins = Math.floor(diffMs / 6e4)
    const hrs  = Math.floor(diffMs / 3.6e6)

    if (hrs < 24) {
        if (hrs > 0) {
            return `${hrs} hour${hrs > 1 ? 's' : ''} ago`
        } else {
            return `${mins} minute${mins !== 1 ? 's' : ''} ago`
        }
    }

    const d    = new Date(Date.now() - diffMs)
    const day  = d.getDate()
    const mon  = d.toLocaleString('default', { month: 'short' })
    const yr   = String(d.getFullYear()).slice(-2)
    return `${day}${getSuffix(day)} ${mon} ${yr}`
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
