import { getUsers } from './actions';
import UserRow from './UserRow';

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Manage Users</h1>
            <table className="w-full border-collapse border">
                <thead>
                <tr className="bg-gray-600">
                    <th className="border p-2">Player Name</th>
                    <th className="border p-2">Character Name</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Role</th>
                    <th className="border p-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <UserRow key={user._id} user={user} />
                ))}
                </tbody>
            </table>
        </div>
    );
}
