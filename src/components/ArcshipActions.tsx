// src/components/ArcshipActions.tsx
'use client'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Dialog, Combobox } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import type { CharacterSummary } from '@/app/(dashboard)/admin/characters/types'
import type { ArcshipSummary }  from '@/app/(dashboard)/admin/arcships/types'

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
    partners: ShipSummary[]     // only ships with a “Trade Agreement”
}

const fetcher = (url:string) => fetch(url).then(r => r.json())

export default function ArcshipActions({
                                           shipId,
                                           creditsBalance,
                                           alloysBalance,
                                           energyBalance,
                                           dataBalance,
                                           essenceBalance,
                                           partners
                                       }: Props) {
    const { mutate } = useSWRConfig()


    // ─── fetch your lists ─────────────────────────────────────────────────────
    const { data: rawChars } = useSWR<CharacterSummary[]>(
        '/api/characters/summary?status=Active', fetcher
    )
    const chars = Array.isArray(rawChars) ? rawChars : []

    const { data: rawShips } = useSWR<ArcshipSummary[]>(
        '/api/arcships/summary', fetcher
    )
    const ships = Array.isArray(rawShips) ? rawShips : []


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
            </div>

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
