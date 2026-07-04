const WS_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'ws://localhost:8910'
    : 'wss://binding-of-mech-ws.onrender.com'; // 默认线上地址，后续可改

export default class NetworkManager {
    constructor() {
        this.ws = null;
        this.roomId = null;
        this.playerId = null;
        this.isHost = false;
        this.connected = false;
        this.onMessage = null;
        this.onOpen = null;
        this.onClose = null;
        this.onError = null;
        this.pingSentAt = 0;
        this.ping = 0;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(WS_URL);
            this.ws.onopen = () => {
                this.connected = true;
                this.startPing();
                if (this.onOpen) this.onOpen();
                resolve();
            };
            this.ws.onmessage = (ev) => this.handleMessage(ev.data);
            this.ws.onclose = () => {
                this.connected = false;
                this.stopPing();
                if (this.onClose) this.onClose();
            };
            this.ws.onerror = (err) => {
                this.connected = false;
                if (this.onError) this.onError(err);
                reject(err);
            };
        });
    }

    startPing() {
        this.stopPing();
        this.pingTimer = setInterval(() => {
            this.pingSentAt = Date.now();
            this.send('ping', {});
        }, 2000);
    }

    stopPing() {
        if (this.pingTimer) clearInterval(this.pingTimer);
    }

    handleMessage(raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }
        if (msg.type === 'pong' && this.pingSentAt) {
            this.ping = Date.now() - this.pingSentAt;
            return;
        }
        if (this.onMessage) this.onMessage(msg);
    }

    send(type, payload = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type, ...payload }));
    }

    createRoom(playerName) {
        this.send('createRoom', { playerName });
    }

    joinRoom(roomId, playerName) {
        this.send('joinRoom', { roomId, playerName });
    }

    startGame(levelId) {
        this.send('startGame', { levelId });
    }

    sendPlayerState(state) {
        this.send('playerState', state);
    }

    sendPlayerAction(action) {
        this.send('playerAction', action);
    }

    sendWorldState(state) {
        this.send('worldState', state);
    }

    disconnect() {
        this.stopPing();
        if (this.ws) this.ws.close();
    }
}
