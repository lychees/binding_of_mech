import { WebSocketServer } from 'ws';

const PORT = process.env.PORT || 8910;

const rooms = new Map();

function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function generatePlayerId() {
    return Math.random().toString(36).substring(2, 10);
}

function send(ws, type, payload) {
    if (ws.readyState === 1) ws.send(JSON.stringify({ type, ...payload }));
}

function broadcast(room, senderId, type, payload) {
    for (const p of room.players) {
        if (p.id !== senderId && p.ws.readyState === 1) {
            send(p.ws, type, payload);
        }
    }
}

function cleanupRoom(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    const alive = room.players.filter(p => p.ws.readyState <= 1);
    if (alive.length === 0) {
        rooms.delete(roomId);
    } else {
        room.players = alive;
    }
}

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
    let playerRoomId = null;
    let playerId = null;

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data);
        } catch {
            send(ws, 'error', { message: 'Invalid JSON' });
            return;
        }

        const { type, ...payload } = msg;

        if (type === 'createRoom') {
            const roomId = generateRoomId();
            playerId = generatePlayerId();
            const room = {
                id: roomId,
                players: [{ id: playerId, ws, host: true, name: payload.playerName || 'Host' }],
                started: false
            };
            rooms.set(roomId, room);
            playerRoomId = roomId;
            send(ws, 'roomCreated', { roomId, playerId, isHost: true });
        }

        if (type === 'joinRoom') {
            const roomId = (payload.roomId || '').toUpperCase();
            const room = rooms.get(roomId);
            if (!room) {
                send(ws, 'error', { message: '房间不存在' });
                return;
            }
            if (room.players.length >= 2) {
                send(ws, 'error', { message: '房间已满' });
                return;
            }
            playerId = generatePlayerId();
            room.players.push({ id: playerId, ws, host: false, name: payload.playerName || 'Guest' });
            playerRoomId = roomId;
            send(ws, 'roomJoined', { roomId, playerId, isHost: false });
            const host = room.players.find(p => p.host);
            if (host) {
                send(host.ws, 'peerJoined', { playerId, name: payload.playerName || 'Guest' });
            }
        }

        if (type === 'startGame') {
            const room = rooms.get(playerRoomId);
            if (!room) return;
            const player = room.players.find(p => p.id === playerId);
            if (!player || !player.host) return;
            room.started = true;
            const seed = Date.now();
            for (const p of room.players) {
                send(p.ws, 'gameStarted', { levelId: payload.levelId || 1, seed });
            }
        }

        if (['playerState', 'playerAction', 'worldState'].includes(type)) {
            const room = rooms.get(playerRoomId);
            if (!room || !room.started) return;
            broadcast(room, playerId, type, payload);
        }
    });

    ws.on('close', () => {
        const room = rooms.get(playerRoomId);
        if (room) {
            broadcast(room, playerId, 'peerDisconnected', { playerId });
            room.players = room.players.filter(p => p.id !== playerId);
            cleanupRoom(playerRoomId);
        }
    });

    ws.on('error', () => {});
});

console.log(`Binding of Mech WebSocket server listening on ws://0.0.0.0:${PORT}`);
