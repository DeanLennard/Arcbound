// src/components/CharacterActions.tsx
'use client'
import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Dialog, Combobox } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import type { CharacterSummary } from '@/app/(dashboard)/admin/characters/types'
import type { ArcshipSummary }  from '@/app/(dashboard)/admin/arcships/types'

// minimal asset shape
interface AssetSummary { _id: string; name: string; category: string }

export default function CharacterActions({
                                             characterId, credits
                                         }: {
    characterId: string
    credits:     number
}) {
    const { mutate } = useSWRConfig()
    const fetcher = (url:string) => fetch(url).then(r=>r.json())

    // ─── fetch your lists ─────────────────────────────────────────────────────
    const { data: rawChars } = useSWR<CharacterSummary[]>(
        '/api/characters?status=Active', fetcher
    )
    const chars = Array.isArray(rawChars) ? rawChars : []

    const { data: rawShips } = useSWR<ArcshipSummary[]>(
        '/api/arcships', fetcher
    )
    const ships = Array.isArray(rawShips) ? rawShips : []

    const { data: assets } = useSWR<AssetSummary[]>(
        `/api/character-assets?character=${characterId}`,
        fetcher
    )

    // only show Items & Implants
    const transferableAssets = (assets ?? []).filter(a =>
        a.category === 'Item' || a.category === 'Implant'
    )

    // ─── credit form ──────────────────────────────────────────────────────────
    type CreditForm = {
        targetType: 'character' | 'arcship'
        targetId:   string
        amount:     number
    }

    const {
        register:   regCredit,
        handleSubmit: handleCreditSubmit,
        watch:        watchCredit,
        setValue:     setCreditValue,
        formState: { errors: creditErrors }
    } = useForm<CreditForm>({
        defaultValues: {
            targetType: 'character',
            targetId:   '',
            amount:     0
        }
    })

    const [charQueryC, setCharQueryC] = useState('')
    const [shipQueryC, setShipQueryC] = useState('')
    const [creditErrorMsg, setCreditErrorMsg] = useState<string|null>(null);
    const [itemErrorMsg, setItemErrorMsg] = useState<string|null>(null);

    const filterCharsC = chars.filter(c =>
        c.charName.toLowerCase().includes(charQueryC.toLowerCase())
    )
    const filterShipsC = ships.filter(s =>
        s.name.toLowerCase().includes(shipQueryC.toLowerCase())
    )

    async function submitCredit(vals: CreditForm) {
        if (vals.amount > credits) {
            setCreditErrorMsg("You don’t have that many credits");
            return
        }

        const res = await fetch('/api/characters/transfer-credit', {
            method:  'POST',
            headers: { 'Content-Type':'application/json' },
            body:    JSON.stringify({ fromChar: characterId, ...vals })
        })

        if (!res.ok) {
            const { error } = await res.json().catch(() => ({}))
            setCreditErrorMsg(error || 'Could not transfer credits');
            return
        }

        setCreditErrorMsg(null);
        setShowCreditModal(false)
        mutate('/api/characters?status=Active')
    }

    // ─── item form ────────────────────────────────────────────────────────────
    type ItemForm = {
        targetChar: string
        assetId:    string
    }

    const {
        register:   regItem,
        handleSubmit: handleItemSubmit,
        watch:        watchItem,
        setValue:     setItemValue,
        formState: { errors: itemErrors }
    } = useForm<ItemForm>({
        defaultValues: {
            targetChar: '',
            assetId:    ''
        }
    })

    const [charQueryI, setCharQueryI] = useState('')
    const filterCharsI = chars.filter(c =>
        c.charName.toLowerCase().includes(charQueryI.toLowerCase())
    )

    async function submitItem(vals: ItemForm) {
        const res = await fetch('/api/characters/transfer-item', {
            method: 'POST',
            headers: { 'Content-Type':'application/json' },
            body: JSON.stringify({ fromChar: characterId, ...vals })
        })

        if (!res.ok) {
            // the API returned 400 + { error: '…' }
            const { error } = await res.json().catch(() => ({}))
            setItemErrorMsg(error || 'Could not transfer item');
            return
        }

        setItemErrorMsg(null);
        // only close on success
        setShowItemModal(false)
        mutate(`/api/character-assets?character=${characterId}`)
    }

    // ─── UI state ─────────────────────────────────────────────────────────────
    const [showCreditModal, setShowCreditModal] = useState(false)
    const [showItemModal,   setShowItemModal]   = useState(false)

    return (
        <>
            <div className="flex gap-2 my-4">
                <button onClick={()=>setShowCreditModal(true)} className="bg-yellow-500 px-3 py-1 rounded">
                    Transfer Credit
                </button>
                <button onClick={()=>setShowItemModal(true)} className="bg-teal-500 px-3 py-1 rounded">
                    Transfer Item
                </button>
            </div>

            {/* ───── CREDIT DIALOG ──────────────────────────────────────────────── */}
            <Dialog open={showCreditModal} onClose={()=>setShowCreditModal(false)}>
                <div className="fixed inset-0 bg-black bg-opacity-75" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-gray-800 p-6 rounded max-w-md w-full">
                        <Dialog.Title className="text-white text-lg mb-4">
                            Transfer Credits (you have {credits})
                        </Dialog.Title>
                        {creditErrorMsg && (
                            <p className="text-red-400 text-sm mb-4">{creditErrorMsg}</p>
                        )}
                        <form onSubmit={handleCreditSubmit(submitCredit)} className="space-y-4">
                            {/* 1) type */}
                            <div>
                                <label className="text-gray-200 block">Send To</label>
                                <select
                                    {...regCredit('targetType')}
                                    className="w-full bg-gray-700 text-white rounded px-2 py-1"
                                >
                                    <option value="character">Character</option>
                                    <option value="arcship">Arcship</option>
                                </select>
                            </div>

                            {/* 2) searchable combobox */}
                            <div>
                                <label className="text-gray-200 block">Target</label>
                                <Combobox
                                    value={watchCredit('targetId')}
                                    onChange={(val: string)=>setCreditValue('targetId', val)}
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
                                {creditErrors.targetId && (
                                    <p className="text-red-400 text-xs">Required</p>
                                )}
                            </div>

                            {/* 3) amount */}
                            <div>
                                <label className="text-gray-200 block">Amount</label>
                                <input
                                    type="number"
                                    {...regCredit('amount', {
                                        required: true,
                                        min: 1,
                                        max: credits
                                    })}
                                    className="w-full bg-gray-700 text-white rounded px-2 py-1"
                                />
                                {creditErrors.amount && (
                                    <p className="text-red-400 text-xs">Invalid amount</p>
                                )}
                            </div>

                            <div className="text-right">
                                <button
                                    type="submit"
                                    className="bg-green-600 px-4 py-2 rounded text-white"
                                >Send</button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* ───── ITEM DIALOG ────────────────────────────────────────────────── */}
            <Dialog open={showItemModal} onClose={()=>setShowItemModal(false)}>
                <div className="fixed inset-0 bg-black bg-opacity-75" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="bg-gray-800 p-6 rounded max-w-md w-full">
                        <Dialog.Title className="text-white text-lg mb-4">
                            Transfer Item
                        </Dialog.Title>
                        {itemErrorMsg && (
                            <p className="text-red-400 text-sm mb-4">{itemErrorMsg}</p>
                        )}
                        <form onSubmit={handleItemSubmit(submitItem)} className="space-y-4">
                            {/* searchable character combobox */}
                            <div>
                                <label className="text-gray-200 block">To Character</label>
                                <Combobox
                                    value={watchItem('targetChar')}
                                    onChange={(val:string)=>setItemValue('targetChar', val)}
                                >
                                    <Combobox.Input
                                        className="w-full bg-gray-700 text-white rounded px-2 py-1"
                                        placeholder="Search characters…"
                                        onChange={e=>setCharQueryI(e.target.value)}
                                        displayValue={v=>
                                            chars.find(c=>c._id===v)?.charName || ''
                                        }
                                    />
                                    <Combobox.Options className="mt-1 max-h-40 overflow-auto bg-gray-700 rounded">
                                        {filterCharsI.map(c=>(
                                            <Combobox.Option
                                                key={c._id}
                                                value={c._id}
                                                className={({ active })=>
                                                    `px-3 py-1 cursor-pointer ${
                                                        active?'bg-indigo-600 text-white':'text-gray-200'
                                                    }`
                                                }
                                            >
                                                {c.charName}
                                            </Combobox.Option>
                                        ))}
                                    </Combobox.Options>
                                </Combobox>
                                {itemErrors.targetChar && (
                                    <p className="text-red-400 text-xs">Required</p>
                                )}
                            </div>

                            {/* asset dropdown */}
                            <div>
                                <label className="text-gray-200 block">Which Item</label>
                                <select
                                    {...regItem('assetId', { required:true })}
                                    className="w-full bg-gray-700 text-white rounded px-2 py-1"
                                >
                                    <option value="">— select item —</option>
                                    {transferableAssets?.map(a=>(
                                        <option key={a._id} value={a._id}>{a.category} - {a.name}</option>
                                    ))}
                                </select>
                                {itemErrors.assetId && (
                                    <p className="text-red-400 text-xs">Required</p>
                                )}
                            </div>

                            <div className="text-right">
                                <button
                                    type="submit"
                                    className="bg-green-600 px-4 py-2 rounded text-white"
                                >
                                    Send Item
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    )
}
