// components/ArcshipGraphic.tsx
'use client'

import React, { useEffect, useRef } from 'react'
import { metricColor } from '@/lib/colors'

interface Props {
    hull:   number
    core:   number
    cmd:    number
    crew:   number
    nav:    number
    sense:  number
    intc:   number
    size?:  number
}

export default function ArcshipGraphic({
                                           hull, core, cmd, crew, nav, sense, intc,
                                           size = 200,
                                       }: Props) {
    const container = useRef<SVGSVGElement>(null)

    useEffect(() => {
        if (!container.current) return
        const map: Record<string, number> = { hull, core, cmd, crew, nav, sense, intc }
        Object.entries(map).forEach(([id, val]) => {
            const el = container.current!.getElementById(id)
            if (el) (el as SVGElement).setAttribute('fill', metricColor(val))
        })
    }, [hull, core, cmd, crew, nav, sense, intc])

    return (
        <svg
            ref={container}
            width={size}
            height={size}
            viewBox="0 0 200 200"
            className="mx-auto"
        >
            {/* inline the SVG from public/arcship.svg here */}
            {/* For brevity I’m just repeating the placeholder shape */}
            <rect x="0" y="0" width="200" height="200" fill="#222"/>
            <path id="hull"     d="M10,10 h180 v20 h-180 Z" fill="transparent"/>
            <path id="core"     d="M10,40 h180 v20 h-180 Z" fill="transparent"/>
            <path id="cmd"      d="M10,70 h180 v20 h-180 Z" fill="transparent"/>
            <path id="crew"     d="M10,100 h180 v20 h-180 Z" fill="transparent"/>
            <path id="nav"      d="M10,130 h180 v20 h-180 Z" fill="transparent"/>
            <path id="sense"    d="M10,160 h180 v20 h-180 Z" fill="transparent"/>
            <path id="intc"     d="M10,190 h180 v10 h-180 Z" fill="transparent"/>
        </svg>
    )
}
