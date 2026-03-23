const crypto = require('crypto');

const MAX_HISTORY = 30;

const sanitizeName = (value) => {
    const input = typeof value === 'string' ? value.trim() : '';
    if (!input) return '';
    return input.slice(0, 40);
};

const sanitizeMessage = (value) => {
    const input = typeof value === 'string' ? value.trim() : '';
    if (!input) return '';
    return input.slice(0, 300);
};

const createEventMessage = ({ sender, text, type = 'message' }) => ({
    id: crypto.randomUUID(),
    sender,
    text,
    type,
    timestamp: new Date().toISOString()
});

const pushHistory = (history, message) => {
    history.push(message);
    if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
    }
};

const setupRealtimeSocket = (io) => {
    const history = [];

    const emitPresence = () => {
        io.emit('chat:presence', { onlineCount: io.engine.clientsCount });
    };

    io.on('connection', (socket) => {
        socket.emit('chat:history', history);
        emitPresence();

        socket.on('chat:join', (payload) => {
            const incomingName = sanitizeName(payload?.name);
            const displayName = incomingName || `User-${socket.id.slice(0, 4)}`;
            socket.data.displayName = displayName;

            const joinNotice = createEventMessage({
                sender: 'System',
                text: `${displayName} joined the live chat.`,
                type: 'system'
            });
            pushHistory(history, joinNotice);
            io.emit('chat:message', joinNotice);
            emitPresence();
        });

        socket.on('chat:message', (payload) => {
            const text = sanitizeMessage(payload?.text);
            if (!text) {
                return;
            }

            const sender = sanitizeName(socket.data.displayName) || `User-${socket.id.slice(0, 4)}`;
            const chatMessage = createEventMessage({
                sender,
                text,
                type: 'message'
            });
            pushHistory(history, chatMessage);
            io.emit('chat:message', chatMessage);
        });

        socket.on('disconnect', () => {
            const displayName = sanitizeName(socket.data.displayName);
            if (displayName) {
                const leaveNotice = createEventMessage({
                    sender: 'System',
                    text: `${displayName} left the live chat.`,
                    type: 'system'
                });
                pushHistory(history, leaveNotice);
                io.emit('chat:message', leaveNotice);
            }
            emitPresence();
        });
    });
};

module.exports = setupRealtimeSocket;
