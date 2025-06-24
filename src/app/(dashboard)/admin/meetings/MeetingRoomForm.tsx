// src/app/(dashboard)/admin/meetings/MeetingRoomForm.tsx
'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import enGB from 'date-fns/locale/en-GB';

interface UserOption {
    _id: string;
    playerName: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

registerLocale('en-GB', enGB);

interface Props {
    initial?: {
        name: string;
        hostId: string;
        coHostIds: string[];
        allowGuests: boolean;
        settings: {
            enableBreakouts: boolean;
            enableRecording: boolean;
            enablePolls: boolean;
            enableQA: boolean;
        };
        scheduledStart?: string;
        durationMinutes?: number;
    };
    onSubmit: (data: any) => Promise<void>;
}

export default function MeetingRoomForm({ initial, onSubmit }: Props) {
    const router = useRouter();

    const { data: userData } = useSWR<{ users: UserOption[] }>('/api/users/all', fetcher)

    const sortedUsers = (userData?.users ?? [])
        .slice()
        .sort((a, b) => a.playerName.localeCompare(b.playerName))

    const [form, setForm] = useState({
        name: initial?.name || '',
        hostId: initial?.hostId || '',
        coHostIds: initial?.coHostIds || [],
        allowGuests: initial?.allowGuests ?? true,
        enableBreakouts: initial?.settings.enableBreakouts ?? true,
        enableRecording: initial?.settings.enableRecording ?? false,
        enablePolls: initial?.settings.enablePolls ?? true,
        enableQA: initial?.settings.enableQA ?? true,
        scheduledStart: initial?.scheduledStart || '',
        durationMinutes: initial?.durationMinutes || 60,
    });

    const [startDate, setStartDate] = useState<Date | null>(
        form.scheduledStart ? new Date(form.scheduledStart) : null
    );

    // whenever DatePicker changes:
    const handleDateChange = (date: Date | null) => {
        setStartDate(date);
        setForm((f) => ({
            ...f,
            scheduledStart: date ? date.toISOString() : '',
        }));
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement
        >
    ) => {
        const { name, value, type, checked, multiple, options } = e.target as any;
        if (name === 'coHostIds' && multiple) {
            const selected = Array.from(options)
                .filter((o: any) => o.selected)
                .map((o: any) => o.value);
            setForm((f) => ({ ...f, coHostIds: selected }));
            return;
        }
        if (type === 'checkbox') {
            setForm((f) => ({ ...f, [name]: checked }));
        } else {
            setForm((f) => ({ ...f, [name]: value }));
        }
    };

    const submit = async (e: FormEvent) => {
        e.preventDefault();
        await onSubmit({ ...form, coHostIds: form.coHostIds });
    };

    return (
        <form
            onSubmit={submit}
            className="space-y-6 p-6 bg-gray-800 border border-gray-700 rounded-lg"
        >
            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-white">Name</label>
                <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Host Selector */}
            <div>
                <label className="block text-sm font-medium text-white">Host</label>
                <select
                    name="hostId"
                    value={form.hostId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">— Select Host —</option>
                    {sortedUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                            {u.playerName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Co-host Selector */}
            <div>
                <label className="block text-sm font-medium text-white">Co-hosts</label>
                <select
                    name="coHostIds"
                    value={form.coHostIds}
                    onChange={handleChange}
                    multiple
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {sortedUsers.map((u) => (
                        <option key={u._id} value={u._id}>
                            {u.playerName}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Hold ⌘/Ctrl to select multiple</p>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                    { name: 'allowGuests', label: 'Allow Guests' },
                    { name: 'enableBreakouts', label: 'Breakouts' },
                    { name: 'enableRecording', label: 'Recording' },
                    { name: 'enablePolls', label: 'Polls' },
                    { name: 'enableQA', label: 'Q&A' },
                ].map((opt) => (
                    <label key={opt.name} className="inline-flex items-center text-white">
                        <input
                            type="checkbox"
                            name={opt.name}
                            checked={(form as any)[opt.name]}
                            onChange={handleChange}
                            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm">{opt.label}</span>
                    </label>
                ))}
            </div>

            {/* Scheduled Start */}
            <div>
                <label className="block text-sm font-medium text-white">Scheduled Start</label>
                <DatePicker
                    selected={startDate}
                    onChange={handleDateChange}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="dd MMM yyyy, HH:mm"
                    locale="en-GB"
                    placeholderText="Select date & time"
                    className="mt-1 block w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Duration */}
            <div>
                <label className="block text-sm font-medium text-white">Duration (minutes)</label>
                <input
                    type="number"
                    name="durationMinutes"
                    value={form.durationMinutes}
                    onChange={handleChange}
                    className="mt-1 block w-32 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Submit */}
            <div className="flex space-x-4 pt-4">
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    {initial ? 'Save Changes' : 'Create Room'}
                </button>
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-gray-500 text-gray-300 rounded hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
