// src/components/Chat/NewChatForm.tsx
import React, { useEffect, useState } from 'react';
import Select from 'react-select';

interface User {
    _id: string;
    characterName: string;
    profileImage?: string;
}

interface Props {
    onClose: () => void;
    onChatCreated: (chat: any) => void;
}

export default function NewChatForm({ onClose, onChatCreated }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [groupName, setGroupName] = useState('');
    const [groupImage, setGroupImage] = useState('');

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => setUsers(data.users))
            .catch(err => console.error('Failed to load users:', err));
    }, []);

    const createChat = async () => {
        if (selectedUsers.length === 0) {
            alert('Please select at least one user.');
            return;
        }

        const isGroup = selectedUsers.length > 1;

        try {
            const res = await fetch('/api/chats/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberIds: selectedUsers.map(u => u._id),
                    isGroup,
                    groupName: isGroup ? groupName : undefined,
                    groupImage: isGroup ? groupImage : undefined
                })
            });
            const data = await res.json();
            onChatCreated(data.chat);
        } catch (err) {
            console.error('Failed to create chat:', err);
        }
    };

    const options = users.map(user => ({
        value: user._id,
        label: user.characterName,
    }));

    const customStyles = {
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#374151', // Tailwind gray-700
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#ffffff', // White text
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#ffffff',
            ':hover': {
                backgroundColor: '#4b5563', // Tailwind gray-600
                color: '#ffffff',
            },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: '#1f2937', // Tailwind gray-800
            color: '#ffffff',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? '#374151' : '#1f2937', // Tailwind gray-700 or gray-800
            color: '#ffffff',
        }),
        control: (provided) => ({
            ...provided,
            backgroundColor: '#1f2937', // Tailwind gray-800
            borderColor: '#4b5563',     // Tailwind gray-600
            color: '#ffffff',
        }),
        input: (provided) => ({
            ...provided,
            color: '#ffffff',
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#ffffff',
        }),
    };

    return (
        <div>
            <label className="block mb-2">Select Users:</label>
            <Select
                isMulti
                options={options}
                onChange={(selectedOptions) => {
                    setSelectedUsers(
                        selectedOptions.map((option: any) =>
                            users.find(user => user._id === option.value)!
                        )
                    );
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                className="mb-4"
                styles={{
                    ...customStyles,
                    menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                    }),
                }}
                placeholder="Search and select users..."
            />

            {/* Show group name/image inputs if multiple users selected */}
            {selectedUsers.length > 1 && (
                <>
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Group Name"
                        className="w-full p-2 bg-gray-800 text-white rounded mb-2"
                    />
                    <label className="block mb-2 text-white">Group Image (optional)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) {
                                setGroupImage('');
                                return;
                            }

                            // Convert image to base64 string
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                setGroupImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                        }}
                        className="w-full p-2 bg-gray-800 text-white rounded mb-4"
                    />
                </>
            )}

            <button
                onClick={createChat}
                className="bg-blue-600 text-white px-2 py-1 rounded w-full"
            >
                Start Chat
            </button>
        </div>
    );
}
