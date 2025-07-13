// app/(dashboard)/admin/reports/page.tsx
'use client'
import { useEffect, useState } from 'react'
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

type Bucket        = { _id: string; count: number }
type PhaseBucket   = { _id: number; count: number }
type PendingChar   = { _id: string; charName: string; faction: string; role: string; race: string }

interface ReportsData {
    factionSpread:   Bucket[]
    roleSpread:      Bucket[]
    archetypeSpread: Bucket[]
    raceSpread:      Bucket[]
    protocolByPhase: PhaseBucket[]
    pendingProtocols: PendingChar[]
}

const COLORS = ['#8884d8','#82ca9d','#ffc658','#ff8042','#8dd1e1','#a4de6c']

export default function ReportsPage() {
    const [data, setData] = useState<ReportsData|null>(null)

    useEffect(() => {
        fetch('/api/reports')
            .then(res => res.json() as Promise<ReportsData>)
            .then(setData)
            .catch(console.error)
    }, [])

    if (!data) return <p>Loading…</p>

    function mkPie(title: string, buckets: Bucket[]) {
        return (
            <div style={{ width: 300, height: 300, margin: 20 }} key={title}>
                <h3>{title}</h3>
                <ResponsiveContainer>
                    <PieChart>
                        <Tooltip formatter={(v:number, name:string)=>[v,name]} />
                        <Pie
                            data={buckets}
                            dataKey="count"
                            nameKey="_id"
                            outerRadius={100}
                            label={p => `${p.payload._id}: ${p.payload.count}`}
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
    }

    return (
        <div style={{ padding: 20 }}>
            <h1>Admin Reports</h1>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '2rem',
                    justifyItems: 'center'
                }}
            >
                {mkPie('Factions',   data.factionSpread)}
                {mkPie('Roles',      data.roleSpread)}
                {mkPie('Archetypes', data.archetypeSpread)}
                {mkPie('Races',      data.raceSpread)}
            </div>

            <div style={{ width: '100%', height: 400, marginTop: 40 }}>
                <h3>Protocols Used per Phase</h3>
                <ResponsiveContainer>
                    <BarChart data={data.protocolByPhase}>
                        <XAxis dataKey="_id" label={{ value: 'Phase #', position: 'insideBottom', dy: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Protocols used" fill={COLORS[0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 40 }}>
                <h3>Pending Protocols in Current Phase</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr>
                        <th style={{ border: '1px solid #ddd', padding: 8 }}>Character</th>
                        <th style={{ border: '1px solid #ddd', padding: 8 }}>Faction</th>
                        <th style={{ border: '1px solid #ddd', padding: 8 }}>Role</th>
                        <th style={{ border: '1px solid #ddd', padding: 8 }}>Race</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.pendingProtocols.map((c, i) => (
                        <tr key={i}>
                            <td style={{ border: '1px solid #ddd', padding: 8 }}>
                                <a
                                href={`/characters/${c._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {c.charName}
                            </a></td>
                            <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.faction}</td>
                            <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.role}</td>
                            <td style={{ border: '1px solid #ddd', padding: 8 }}>{c.race}</td>
                        </tr>
                    ))}
                    {data.pendingProtocols.length === 0 && (
                        <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: 8 }}>
                                Everyone has used a protocol in this phase!
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
