// src/components/ArcshipActions.tsx
'use client'
import {useMemo, useState} from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { useRouter } from 'next/navigation'
import { Dialog, Combobox } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import type { CharacterSummary } from '@/app/(dashboard)/admin/characters/types'
import type { ArcshipSummary }  from '@/app/(dashboard)/admin/arcships/types'
import {SectorDoc} from "@/models/Sector";

export interface ShipSummary {
    _id: string
    name: string
}

// props passed from your server page
interface Props {
    shipId: string
    creditsBalance: number
    alloysBalance: number
    energyBalance: number
    dataBalance: number
    essenceBalance: number
    partners: ShipSummary[]
    navTotal: number
    intMovement: number
    currentX: number
    currentY: number
}

const fetcher = (url:string) => fetch(url).then(r => r.json())

export default function ArcshipActions({
                                           shipId,
                                           creditsBalance,
                                           alloysBalance,
                                           energyBalance,
                                           dataBalance,
                                           essenceBalance,
                                           partners,
                                           navTotal,
                                           intMovement,
                                           currentX,
                                           currentY
                                       }: Props) {
    const { mutate } = useSWRConfig()
    const [showMove, setShowMove] = useState(false);
    const router = useRouter()
    const [moveError, setMoveError] = useState<string | null>(null)

    // ─── fetch your lists ─────────────────────────────────────────────────────
    const { data: rawChars } = useSWR<CharacterSummary[]>(
        '/api/characters/summary?status=Active', fetcher
    )
    const chars = Array.isArray(rawChars) ? rawChars : []

    const { data: rawShips } = useSWR<ArcshipSummary[]>(
        '/api/arcships/summary', fetcher
    )
    const ships = Array.isArray(rawShips) ? rawShips : []

    const { data: allSectors = [] } = useSWR<SectorDoc[]>('/api/sectors', fetcher);

    // ── MOVE SHIP ─────────────────────────────────────────────

    function getReachable(
        sectors: SectorDoc[],
        curX: number,
        curY: number
    ): SectorDoc[] {
        // flat-top odd-q offset:
        // odd columns are shifted down by +0.5 hex
        const evenDeltas: [number, number][] = [
            [-1, -1], // NW
            [ 0, -1], // N
            [ 1, -1], // NE
            [ 1,  0], // SE
            [ 0,  1], // S
            [-1,  0], // SW
        ];

        const oddDeltas: [number, number][] = [
            [ -1,  0], // NW
            [ 0, -1], // N
            [ 1,  0], // NE
            [ 1,  1], // SE
            [ 0,  1], // S
            [-1,  1], // SW
        ];

        const deltas = curX % 2 === 0 ? evenDeltas : oddDeltas;

        return sectors.filter(s => {
            return deltas.some(([dx, dy]) =>
                s.x === curX + dx && s.y === curY + dy
            );
        });
    }

    const reachable = useMemo(
        () => getReachable(allSectors, currentX, currentY),
        [allSectors, currentX, currentY]
    );

    async function submitMove(to: string) {
        if (navTotal <= 0 || intMovement <= 0) {
            setMoveError("Your ship can't move this turn")
            return
        }
        setMoveError(null)

        const res = await fetch('/api/arcships/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipId, toSector: to })
        })

        if (!res.ok) {
            // pull the error message from the JSON, or fall back
            const { error: msg } = await res.json().catch(() => ({}))
            setMoveError(msg || 'Move failed')
            return
        }

        // on success, close & refresh
        setShowMove(false)
        mutate(`/api/arcships/${shipId}`)
        router.refresh()
    }

    // constants for hex math
    const HEX_SIZE  = 50
    const H_SPACING = 1.5 * HEX_SIZE
    const V_SPACING = Math.sqrt(3) * HEX_SIZE

    /** flat-top odd-q → pixel converter */
    function hexToPixel(x: number, y: number) {
        const q = x
        const r = y - (q - (q & 1)) / 2
        return {
            px: H_SPACING * q,
            py: V_SPACING * (r + q/2),
        }
    }

    /** build the “hex corners” once */
    function getHexPoints(size: number) {
        return Array.from({ length: 6 })
            .map((_, i) => {
                const angle = (Math.PI / 3) * i
                return [size * Math.cos(angle), size * Math.sin(angle)].join(',')
            })
            .join(' ')
    }

    const hexPts = getHexPoints(HEX_SIZE)

    // ── TRANSFER CREDITS ─────────────────────────────────────────────
    type CreditFormValues = {
        targetType: 'character' | 'arcship'
        targetId:   string
        amount:     number
    }

    const {
        register: regCredit,
        handleSubmit: handleCreditSubmit,
        watch: watchCredit,
        setValue: setCreditValue,
        formState: { errors: creditErrors }
    } = useForm<CreditFormValues>({
        defaultValues: { targetType:'arcship', targetId:'', amount:0 }
    })

    const [charQueryC, setCharQueryC] = useState('')
    const [shipQueryC, setShipQueryC] = useState('')
    const [creditErrorMsg, setCreditErrorMsg] = useState<string|null>(null)
    const [showCreditModal, setShowCreditModal] = useState(false)

    const filterCharsC = chars.filter(c =>
        c.charName.toLowerCase().includes(charQueryC.toLowerCase())
    )
    const filterShipsC = ships.filter(s =>
        s.name.toLowerCase().includes(shipQueryC.toLowerCase())
    )

    async function submitCredit(vals:CreditFormValues) {
        const { targetType, targetId, amount } = vals
        if (amount > creditsBalance) {
            setCreditErrorMsg("Not enough credits in this ship")
            return
        }
        const res = await fetch('/api/arcships/transfer-credit', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ fromShip: shipId, targetType, targetId, amount })
        })
        if (!res.ok) {
            const { error } = await res.json().catch(()=>({}))
            setCreditErrorMsg(error||'Failed to transfer credits')
            return
        }
        setCreditErrorMsg(null)
        setShowCreditModal(false)
        mutate(`/api/arcships/${shipId}`)
    }

    // ── TRANSFER RESOURCES ───────────────────────────────────────────
    type ResourceFormValues = {
        targetShip: string
        resource:   'alloysBalance'|'energyBalance'|'dataBalance'|'essenceBalance'
        amount:     number
    }

    const {
        register: regRes,
        handleSubmit: handleResSubmit,
        watch: watchRes,
        setValue: setResValue,
        formState: { errors: resErrors }
    } = useForm<ResourceFormValues>({
        defaultValues:{ targetShip:'', resource:'alloysBalance', amount:0 }
    })

    const [resErrorMsg, setResErrorMsg] = useState<string|null>(null)
    const [showResModal, setShowResModal] = useState(false)

    async function submitResource(vals:ResourceFormValues) {
        const { targetShip, resource, amount } = vals
        const available = { alloysBalance, energyBalance, dataBalance, essenceBalance }[resource]
        if (amount > available) {
            setResErrorMsg(`Not enough ${resource.replace('Balance','')}`)
            return
        }
        const res = await fetch('/api/arcships/transfer-resource', {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ fromShip: shipId, toShip: targetShip, resource, amount })
        })
        if (!res.ok) {
            const { error } = await res.json().catch(()=>({}))
            setResErrorMsg(error||'Failed to transfer resource')
            return
        }
        setResErrorMsg(null)
        setShowResModal(false)
        mutate(`/api/arcships/${shipId}`)
    }

    return (
        <>
            <div className="flex gap-2 my-4">
                <button onClick={()=>setShowCreditModal(true)} className="px-3 py-1 bg-yellow-500 rounded">
                    Transfer Credits
                </button>
                <button onClick={()=>setShowResModal(true)} className="px-3 py-1 bg-blue-500 rounded">
                    Transfer Resources
                </button>
                <button
                    onClick={() => setShowMove(true)}
                    className="px-3 py-1 rounded bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                    disabled={navTotal <= 0 || intMovement <= 0}
                >
                    Move Arcship
                </button>
            </div>

            {/* ——— MOVE SHIP MODAL ——— */}
            <Dialog open={showMove} onClose={() => setShowMove(false)}>
                <div className="fixed inset-0 bg-black bg-opacity-60" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-gray-800 p-6 rounded max-w-xs w-full">
                        <Dialog.Title className="text-white text-lg mb-4">
                            Move Arcship
                        </Dialog.Title>

                        {moveError && (
                            <p className="text-red-400 mb-2">{moveError}</p>
                        )}

                        {reachable.length === 0 ? (
                            <p className="text-gray-300">No adjacent sectors.</p>
                        ) : (
                            <svg
                                width={HEX_SIZE*6}
                                height={HEX_SIZE*6}
                                viewBox={`${-HEX_SIZE*3} ${-HEX_SIZE*3} ${HEX_SIZE*6} ${HEX_SIZE*6}`}
                            >
                                {/* highlight the current hex */}
                                <polygon
                                    points={hexPts}
                                    stroke="#FFD700"
                                    strokeWidth={2}
                                    fill="none"
                                />

                                {reachable.map(s => {
                                    // compute absolute pixels
                                    const { px: X, py: Y } = hexToPixel(s.x, s.y)
                                    const { px: CX, py: CY } = hexToPixel(currentX, currentY)

                                    // this hex’s offset around the center
                                    const dx = X - CX
                                    const dy = Y - CY

                                    return (
                                        <g key={s._id} transform={`translate(${dx},${dy})`}>
                                            <polygon
                                                points={hexPts}
                                                stroke="#fff"
                                                strokeWidth={1}
                                                fill="rgba(72,187,120,0.8)"
                                                className="cursor-pointer hover:fill-green-400"
                                                onClick={() => submitMove(s._id)}
                                            />
                                            <foreignObject
                                                x={-HEX_SIZE * 0.8}
                                                y={-HEX_SIZE * 0.5}
                                                width={HEX_SIZE * 1.6}
                                                height={HEX_SIZE}
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                <div
                                                    className="w-full h-full flex items-center justify-center text-xs leading-tight text-black text-center break-words"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    {s.name} ({s.x}, {s.y})
                                                </div>
                                            </foreignObject>
                                        </g>
                                    )
                                })}
                            </svg>
                        )}
                    </Dialog.Panel>
                </div>
            </Dialog>


            {/* ——— CREDIT MODAL ——— */}
            <Dialog open={showCreditModal} onClose={()=>setShowCreditModal(false)}>
                <div className="fixed inset-0 bg-black bg-opacity-60" aria-hidden="true"/>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-gray-800 p-6 rounded max-w-md w-full space-y-4">
                        <Dialog.Title className="text-white text-lg">
                            Transfer Credits (you have {creditsBalance})
                        </Dialog.Title>
                        {creditErrorMsg && <p className="text-red-400">{creditErrorMsg}</p>}
                        <form onSubmit={handleCreditSubmit(submitCredit)} className="space-y-4">
                            <div>
                                <label className="text-gray-200 block">Send To</label>
                                <select {...regCredit('targetType')} className="mt-1 w-full bg-gray-700 text-white rounded px-2 py-1">
                                    <option value="arcship">Arcship</option>
                                    <option value="character">Character</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-200 block">Target</label>
                                <Combobox
                                    value={watchCredit('targetId')}
                                    onChange={(val:string)=>setCreditValue('targetId',val)}
                                >
                                    <Combobox.Input
                                        className="w-full bg-gray-700 text-white rounded px-2 py-1"
                                        placeholder={
                                            watchCredit('targetType') === 'character'
                                                ? 'Search characters…'
                                                : 'Search ships…'
                                        }
                                        onChange={e=>{
                                            if (watchCredit('targetType')==='character')
                                                setCharQueryC(e.target.value)
                                            else
                                                setShipQueryC(e.target.value)
                                        }}
                                        displayValue={(val:string) => {
                                            if (watchCredit('targetType')==='character')
                                                return chars.find(c=>c._id===val)?.charName || ''
                                            return ships.find(s=>s._id===val)?.name || ''
                                        }}
                                    />
                                    <Combobox.Options className="mt-1 max-h-40 overflow-auto bg-gray-700 rounded">
                                        {(watchCredit('targetType')==='character' ? filterCharsC : filterShipsC)
                                            .map(item=>(
                                                <Combobox.Option
                                                    key={item._id}
                                                    value={item._id}
                                                    className={({ active })=>
                                                        `px-3 py-1 cursor-pointer ${
                                                            active ? 'bg-indigo-600 text-white' : 'text-gray-200'
                                                        }`
                                                    }
                                                >
                                                    { watchCredit('targetType')==='character'
                                                        ? (item as CharacterSummary).charName
                                                        : (item as ArcshipSummary).name
                                                    }
                                                </Combobox.Option>
                                            ))}
                                    </Combobox.Options>
                                </Combobox>
                                {creditErrors.targetId && <p className="text-red-400 text-xs">Required</p>}
                            </div>
                            <div>
                                <label className="text-gray-200 block">Amount</label>
                                <input
                                    type="number"
                                    {...regCredit('amount',{ required:true, min:1, max:creditsBalance })}
                                    className="mt-1 w-full bg-gray-700 text-white rounded px-2 py-1"
                                />
                                {creditErrors.amount && <p className="text-red-400 text-xs">Invalid</p>}
                            </div>
                            <div className="text-right">
                                <button type="submit" className="bg-green-600 px-4 py-2 rounded text-white">
                                    Send
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* ——— RESOURCE MODAL ——— */}
            <Dialog open={showResModal} onClose={()=>setShowResModal(false)}>
                <div className="fixed inset-0 bg-black bg-opacity-60" aria-hidden="true"/>
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-gray-800 p-6 rounded max-w-md w-full space-y-4">
                        <Dialog.Title className="text-white text-lg">
                            Transfer Resources
                        </Dialog.Title>
                        {resErrorMsg && <p className="text-red-400">{resErrorMsg}</p>}
                        <form onSubmit={handleResSubmit(submitResource)} className="space-y-4">
                            <div>
                                <label className="text-gray-200 block">Resource</label>
                                <select {...regRes('resource')}
                                        className="mt-1 w-full bg-gray-700 text-white rounded px-2 py-1"
                                >
                                    <option value="alloysBalance">Alloys</option>
                                    <option value="energyBalance">Energy</option>
                                    <option value="dataBalance">Data</option>
                                    <option value="essenceBalance">Essence</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-gray-200 block">Target Arcship</label>
                                <Combobox
                                    value={watchRes('targetShip')}
                                    onChange={(val:string)=>setResValue('targetShip',val)}
                                >
                                    <Combobox.Input
                                        className="w-full bg-gray-700 text-white rounded px-2 py-1"
                                        placeholder="Search partners…"
                                        displayValue={v=>partners.find(p=>p._id===v)?.name||''}
                                    />
                                    <Combobox.Options className="mt-1 max-h-40 overflow-auto bg-gray-700 rounded">
                                        {partners.map(p=>(
                                            <Combobox.Option key={p._id} value={p._id}
                                                             className={({active})=>
                                                                 `px-3 py-1 cursor-pointer ${active?'bg-indigo-600 text-white':'text-gray-200'}`
                                                             }
                                            >
                                                {p.name}
                                            </Combobox.Option>
                                        ))}
                                    </Combobox.Options>
                                </Combobox>
                                {resErrors.targetShip && <p className="text-red-400 text-xs">Required</p>}
                            </div>
                            <div>
                                <label className="text-gray-200 block">Amount</label>
                                <input type="number"
                                       {...regRes('amount',{ required:true, min:1 })}
                                       className="mt-1 w-full bg-gray-700 text-white rounded px-2 py-1"
                                />
                                {resErrors.amount && <p className="text-red-400 text-xs">Invalid</p>}
                            </div>
                            <div className="text-right">
                                <button type="submit" className="bg-green-600 px-4 py-2 rounded text-white">
                                    Transfer
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    )
}
