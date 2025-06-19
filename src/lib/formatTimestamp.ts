// src/lib/formatTimestamp.ts

export function formatTimestamp(createdAt?: string, updatedAt?: string): string {
    if (!createdAt) return 'Unknown'

    const created = new Date(createdAt)
    const updated = updatedAt ? new Date(updatedAt) : null
    const now = new Date()

    // decide whether to show “edited … ago”
    const showEdit = updated && updated.getTime() - created.getTime() > 1000

    // helper to format “X ago” or fallback to date
    function when(ts: Date): string {
        const diffMs   = now.getTime() - ts.getTime()
        const diffHrs  = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMins = Math.floor(diffMs / (1000 * 60))

        if (diffHrs < 24) {
            if (diffHrs >= 1) {
                return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`
            } else {
                return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
            }
        } else {
            const day   = ts.getDate()
            const mon   = ts.toLocaleString('default', { month: 'short' })
            const year  = ts.getFullYear().toString().slice(-2)
            return `${day}${getDaySuffix(day)} ${mon} ${year}`
        }
    }

    // format the main “created” bit
    const base = when(created)

    // if edited, show “(edited X ago)” or date
    if (showEdit && updated) {
        return `${base} (edited ${when(updated)})`
    }

    return base
}

function getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th'
    switch (day % 10) {
        case 1: return 'st'
        case 2: return 'nd'
        case 3: return 'rd'
        default: return 'th'
    }
}
