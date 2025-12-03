// src/app/sectormap/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

type Sector = {
    _id:    string;
    name:   string;
    x:      number;
    y:      number;
    control:string;
    hasMission: boolean;
};

type ShipPos = {
    _id:     string;
    name:    string;
    xSector: number;
    ySector: number;
    flagUrl?: string;
};

const CONTROL_COLORS: Record<string, string> = {
    'Aeon Collective':      '#008080',
    'Helion Federation':    '#808080',
    'Korveth Dominion':     '#C62828',
    'Sundered Concord':     '#EF6C00',
    'Tyr Solaris Imperium': '#FDD835',
    'Virean Ascendancy':    '#5E35B1',
    'Neutral':              '#1E88E5',
    'Uncontested':          '#43A047',
};

const HEX_SIZE      = 40;
const H_SPACING     = 1.5 * HEX_SIZE;
const V_SPACING     = Math.sqrt(3) * HEX_SIZE;

function getHexPoints(size: number): string {
    return Array.from({ length: 6 })
        .map((_, i) => {
            const angle = (Math.PI / 3) * i;
            return [ size * Math.cos(angle), size * Math.sin(angle) ].join(',');
        })
        .join(' ');
}

export default function SectorMapPage() {
    const [sectors, setSectors] = useState<Sector[] | null>(null);
    const [ships,   setShips]   = useState<ShipPos[] | null>(null);
    const [error,   setError]   = useState<string | null>(null);
    const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<any | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/sectors').then(r => r.json()),
            fetch('/api/arcships/with-sector').then(r => r.json()),
        ])
            .then(([sec, shp]) => {
                setSectors(sec);
                setShips(shp);
            })
            .catch(err => setError(err.message));
    }, []);

    useEffect(() => {
        if (!selectedSectorId) return;

        fetch(`/api/sectors/${selectedSectorId}`)
            .then(r => r.json())
            .then(data => setSelectedSector(data));
    }, [selectedSectorId]);

    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    if (!sectors || !ships) return <p>Loading…</p>;

    const hexPts = getHexPoints(HEX_SIZE);

    // Precalculate positions
    const pos = (x: number, y: number) => {
        let cy = y * V_SPACING;
        if (x % 2 !== 0) cy += V_SPACING/2;
        return { cx: x * H_SPACING, cy };
    };

    // Compute viewBox bounds
    const allXs = sectors.map(s => pos(s.x, s.y).cx);
    const allYs = sectors.map(s => pos(s.x, s.y).cy);
    const minX = Math.min(...allXs) - HEX_SIZE;
    const maxX = Math.max(...allXs) + HEX_SIZE;
    const minY = Math.min(...allYs) - HEX_SIZE;
    const maxY = Math.max(...allYs) + HEX_SIZE;

    return (
        <div className="pt-12 md:pt-14 w-full h-full p-4 flex justify-center items-center">
            <img
                src="/map.jpg"
                alt="Sector background"
                className="fixed top-[52px] md:top-14 left-0 right-0 bottom-0 w-full h-full object-cover"
            />

            <svg
                className="absolute top-[52px] md:top-14 left-0 right-0 bottom-0"
                viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* draw sectors */}
                {sectors.map(s => {
                    const { cx, cy } = pos(s.x, s.y);
                    return (
                        <g key={s._id} transform={`translate(${cx},${cy})`}>
                            <polygon
                                points={hexPts}
                                stroke="#333"
                                strokeWidth={1}
                                fill={CONTROL_COLORS[s.control] ?? '#DDD'}
                                fillOpacity={0.8}
                            />

                            <text
                                x={0}
                                y={4}
                                textAnchor="middle"
                                fontSize="4px"
                                fill="#fff"
                            >
                                {s.name} ({s.x}, {s.y})
                            </text>

                            {/* 🛰 mission flag */}
                            {s.hasMission && (
                                <image
                                    href="/flags/mission.png"
                                    x={HEX_SIZE * 0.1 - 28}      // tweak these offsets…
                                    y={-HEX_SIZE * 0.8}     // …so it sits nicely over the polygon
                                    width={12}
                                    height={12}
                                />
                            )}
                            {/* view sector (eye icon) */}
                            <image
                                href="/flags/eye.png"
                                x={HEX_SIZE * 0.25}
                                y={-HEX_SIZE * 0.85}
                                width={10}
                                height={10}
                                style={{ cursor: 'pointer' }}
                                onClick={() => setSelectedSectorId(s._id)}
                            />
                        </g>
                    );
                })}

                {/* draw arcship flags */}
                {(() => {
                    // group ships by their sector coords
                    const bySector = ships.reduce<Record<string, ShipPos[]>>((acc, s) => {
                        const key = `${s.xSector},${s.ySector}`;
                        (acc[key] ||= []).push(s);
                        return acc;
                    }, {});

                    return ships.map(ship => {
                        const { cx, cy } = pos(ship.xSector, ship.ySector);
                        const group = bySector[`${ship.xSector},${ship.ySector}`];
                        const idx   = group.findIndex(s => s._id === ship._id);
                        const n     = group.length;

                        // radius of our little circle around the center
                        const R = HEX_SIZE * 0.6;
                        // start at straight up (-90°), then fan clockwise
                        const angle = -Math.PI/2 + (2 * Math.PI * idx) / n;
                        const dx = R * Math.cos(angle);
                        const dy = R * Math.sin(angle);

                        return (
                            <g key={ship._id} transform={`translate(${cx+dx},${cy+dy})`}>
                                {/* small centered flag */}
                                <image
                                    href={ship.flagUrl ?? '/flags/flag.png'}
                                    x={-6} y={-6}
                                    width={12} height={12}
                                />
                                {/* tiny name below the flag */}
                                <text
                                    x={0}
                                    y={9}
                                    textAnchor="middle"
                                    fontSize="3px"
                                    fill="#000"
                                    stroke="#fff"
                                    strokeWidth="0.3"
                                    paintOrder="stroke"
                                >
                                    {ship.name}
                                </text>
                            </g>
                        );
                    });
                })()}
            </svg>
            {selectedSector && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={() => setSelectedSectorId(null)}
                >
                    <div
                        className="bg-gray-800 p-6 rounded-xl w-full max-w-lg space-y-4 text-white"
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 className="text-2xl font-bold">{selectedSector.name}</h2>

                        <p className="text-gray-300">
                            Coordinates: ({selectedSector.x}, {selectedSector.y})<br />
                            Control: {selectedSector.control}
                        </p>

                        {selectedSector.hasMission && (
                            <div className="bg-indigo-700 p-3 rounded text-white">
                                This sector contains a mission.
                            </div>
                        )}

                        <h3 className="text-xl font-semibold mt-4">Effects</h3>
                        <ul className="space-y-2">
                            {selectedSector.effects?.map((e: any) => (
                                <li
                                    key={e._id}
                                    className={`p-2 rounded text-white ${
                                        e.kind === 'Positive'
                                            ? 'bg-green-600'
                                            : e.kind === 'Negative'
                                                ? 'bg-red-600'
                                                : 'bg-gray-700'
                                    }`}
                                >
                                    <strong>{e.name}</strong> (Lv {e.level})
                                    <p className="text-sm">{e.description}</p>
                                </li>
                            ))}
                        </ul>

                        <button
                            className="px-4 py-2 bg-red-600 rounded w-full mt-4"
                            onClick={() => setSelectedSectorId(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
