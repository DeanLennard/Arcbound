// src/socket/socket.ts
import { io } from 'socket.io-client';

// Make sure to call the API route once so the server initializes
if (typeof window !== 'undefined') {
    fetch('/api/socket');
}

const socket = io();

export default socket;
