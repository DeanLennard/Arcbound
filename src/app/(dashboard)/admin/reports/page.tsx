// app/(dashboard)/admin/reports/page.tsx
'use client'
import { useEffect, useState } from 'react'
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type Bucket = { _id: string; count: number }
type PhaseBucket = { _id: number; count: number }

interface ReportsData {
    factionSpread:   Bucket[]
    roleSpread:      Bucket[]
    archetypeSpread: Bucket[]
    raceSpread:      Bucket[]
    protocolByPhase: PhaseBucket[]
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#a4de6c']

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null)

    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json())
            .then(setData)
            .catch(console.error)
    }, [])

    if (!data) return <p>Loading…</p>

    const mkPie = (title: string, buckets: Bucket[]) => (
        <div style={{ width: 300, height: 300, margin: '1rem' }}>
            <h3>{title}</h3>
            <ResponsiveContainer>
                <PieChart>
                    {/* optional tooltip on hover */}
                    <Tooltip
                        formatter={(value: number, name: string) => [value, name]}
                    />
                    <Pie
                        data={buckets}
                        dataKey="count"
                        nameKey="_id"
                        outerRadius={100}
                        // custom label: show “<name>: <count>”
                        label={({ payload }) => `${payload._id}: ${payload.count}`}
                        labelLine={false}
                    >
                        {buckets.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    )

    return (
        <div style={{ padding: 20 }}>
            <h1>Admin Reports</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {mkPie('Factions',    data.factionSpread)}
                {mkPie('Roles',       data.roleSpread)}
                {mkPie('Archetypes',  data.archetypeSpread)}
                {mkPie('Races',       data.raceSpread)}
            </div>

            <div style={{ width: '100%', height: 400, marginTop: 40 }}>
                <h3>Protocols Used per Phase</h3>
                <ResponsiveContainer>
                    <BarChart data={data.protocolByPhase as any}>
                        <XAxis dataKey="_id" label={{ value: 'Phase #', position: 'insideBottom', dy: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Protocols used" fill={COLORS[0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
