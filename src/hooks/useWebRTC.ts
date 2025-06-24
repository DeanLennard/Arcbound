// src/hooks/useWebRTC.ts
import { useEffect, useRef, useState } from 'react';
import socket from '@/socket/socket';

interface PeerInfo {
    peerId: string;
    stream: MediaStream;
}

export function useWebRTC(roomId: string) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const peersRef = useRef<Record<string, RTCPeerConnection>>({});
    const pendingCandidatesRef = useRef<Record<string, RTCIceCandidateInit[]>>({});
    const [peers, setPeers] = useState<PeerInfo[]>([]);
    const answeredPeersRef = useRef<Record<string, boolean>>({});

    useEffect(() => {
        let localStream: MediaStream;

        async function initLocal() {
            localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = localStream;
            }

            // Listen for all signaling messages
            socket.on('allUsers', handleAllUsers);
            socket.on('userJoined', handleUserJoined);
            socket.on('userLeft', handleUserLeft);
            socket.on('ice-candidate', handleIceCandidate);
            socket.on('offer', handleOffer);
            socket.on('answer', handleAnswer);

            // Join (or rejoin) the room
            socket.emit('joinRoom', { roomId });
        }

        // ----- Handlers -----
        const handleAllUsers = (users: string[]) => {
            // tear down old connections
            Object.values(peersRef.current).forEach((pc) => pc.close());
            peersRef.current = {};
            setPeers([]);

            users.forEach((userId) => createPeer(userId, true));
        };

        const handleUserJoined = ({ peerId }: { peerId: string }) => {
            createPeer(peerId, false);
        };

        const handleUserLeft = ({ peerId }: { peerId: string }) => {
            peersRef.current[peerId]?.close();
            delete peersRef.current[peerId];
            delete answeredPeersRef.current[peerId];
            setPeers((prev) => prev.filter((p) => p.peerId !== peerId));
        };

        const handleIceCandidate = ({ from, candidate }: any) => {
            const pc = peersRef.current[from];
            if (!pc || !pc.remoteDescription) {
                // queue it
                pendingCandidatesRef.current[from] ||= [];
                pendingCandidatesRef.current[from].push(candidate);
            } else {
                // safe to add immediately
                pc.addIceCandidate(candidate).catch(console.error);
            }
        };

        async function handleOffer({ from, sdp }: any) {
            const pc = createPeer(from, false);

            // 1) Set remote description only when we’re not mid-negotiation
            if (pc.signalingState !== 'stable') return;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            // 2) Flush any queued ICE candidates
            (pendingCandidatesRef.current[from] || []).forEach((cand) =>
                pc.addIceCandidate(cand).catch(console.error)
            );
            pendingCandidatesRef.current[from] = [];

            // 3) Only now, if we *really* have a remote offer, answer once
            // signallingState becomes "have-remote-offer"
            if ((pc.signalingState as any) !== 'have-remote-offer') return;

            try {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { to: from, sdp: pc.localDescription });
            } catch (err) {
                // silently ignore if we raced
            }
        }

        async function handleAnswer({ from, sdp }: any) {
            const pc = peersRef.current[from];
            if (!pc) return;   // no peer connection at all

            try {
                // try to set the remote SDP answer
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            } catch (err) {
                console.warn('Failed to set remote answer (might be a stale/duplicate):', err);
            }

            // flush any queued ICE candidates now or earlier
            (pendingCandidatesRef.current[from] || []).forEach((cand) =>
                pc.addIceCandidate(cand).catch((e) =>
                    console.warn('Failed queued ICE candidate after answer:', e)
                )
            );
            pendingCandidatesRef.current[from] = [];
        }

        // ----- Peer creation -----
        function createPeer(peerId: string, isInitiator: boolean) {
            if (peersRef.current[peerId]) return peersRef.current[peerId];

            const pc = new RTCPeerConnection({ iceServers: [ /* … */ ] });
            peersRef.current[peerId] = pc;

            localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

            pc.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    socket.emit('ice-candidate', { to: peerId, candidate });
                }
            };

            pc.ontrack = (event) => {
                setPeers((prev) => [
                    ...prev.filter((p) => p.peerId !== peerId),
                    { peerId, stream: event.streams[0] },
                ]);
            };

            if (isInitiator) {
                let makingOffer = false;
                pc.onnegotiationneeded = async () => {
                    if (makingOffer) return;
                    makingOffer = true;
                    try {
                        if (pc.signalingState !== 'stable') return;
                        const offer = await pc.createOffer();
                        await pc.setLocalDescription(offer);
                        socket.emit('offer', { to: peerId, sdp: pc.localDescription });
                    } finally {
                        makingOffer = false;
                    }
                };
            }

            pendingCandidatesRef.current[peerId] ||= [];

            return pc;
        }

        initLocal();

        // Clean up on disconnect (page unload or network drop)
        const handleSocketDisconnect = () => {
            Object.values(peersRef.current).forEach((pc) => pc.close());
            peersRef.current = {};
            setPeers([]);
        };
        socket.on('disconnect', handleSocketDisconnect);

        // Also rejoin on reconnect
        const handleReconnect = () => {
            socket.emit('joinRoom', { roomId });
        };
        socket.on('connect', handleReconnect);

        // ----- Cleanup -----
        return () => {
            socket.emit('leaveRoom', { roomId });
            socket.off('allUsers', handleAllUsers);
            socket.off('userJoined', handleUserJoined);
            socket.off('userLeft', handleUserLeft);
            socket.off('ice-candidate', handleIceCandidate);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('disconnect', handleSocketDisconnect);
            socket.off('connect', handleReconnect);

            Object.values(peersRef.current).forEach((pc) => pc.close());
            peersRef.current = {};
            setPeers([]);
        };
    }, [roomId]);

    return { localVideoRef, peers };
}
