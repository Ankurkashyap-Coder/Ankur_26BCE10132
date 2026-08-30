const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const activeRooms = {};

io.on('connection', (socket) => {
    let currentRoom = null;
    let isRoleAdmin = false;

    socket.on('createRoom', ({ question, options }) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        const optionsObj = {};
        options.forEach(opt => { if(opt.trim() !== '') optionsObj[opt] = 0; });

        activeRooms[roomCode] = {
            question,
            options: optionsObj,
            totalVotes: 0,
            state: 'waiting',
            participants: 0
        };

        currentRoom = roomCode;
        isRoleAdmin = true;
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode) => {
        if (!activeRooms[roomCode]) {
            return socket.emit('errorMsg', 'Room not found. Check the code.');
        }
        currentRoom = roomCode;
        socket.join(roomCode);
        activeRooms[roomCode].participants += 1;
        io.to(roomCode).emit('updateParticipantCount', activeRooms[roomCode].participants);
        socket.emit('joinedRoomSuccessfully', {
            state: activeRooms[roomCode].state,
            question: activeRooms[roomCode].question,
            options: Object.keys(activeRooms[roomCode].options)
        });
    });

    socket.on('startVoting', () => {
        if (isRoleAdmin && activeRooms[currentRoom]) {
            activeRooms[currentRoom].state = 'voting';
            io.to(currentRoom).emit('votingStarted', {
                question: activeRooms[currentRoom].question,
                options: Object.keys(activeRooms[currentRoom].options)
            });
        }
    });

    socket.on('submitVote', (selectedOption) => {
        if (activeRooms[currentRoom] && activeRooms[currentRoom].state === 'voting') {
            if (activeRooms[currentRoom].options[selectedOption] !== undefined) {
                activeRooms[currentRoom].options[selectedOption] += 1;
                activeRooms[currentRoom].totalVotes += 1;
                io.to(currentRoom).emit('liveResultsUpdate', {
                    options: activeRooms[currentRoom].options,
                    totalVotes: activeRooms[currentRoom].totalVotes
                });
            }
        }
    });

    socket.on('endPoll', () => {
        if (isRoleAdmin && activeRooms[currentRoom]) {
            activeRooms[currentRoom].state = 'ended';
            const options = activeRooms[currentRoom].options;
            let winner = 'No votes';
            let maxVotes = -1;
            for (const [key, value] of Object.entries(options)) {
                if (value > maxVotes) { maxVotes = value; winner = key; }
            }
            io.to(currentRoom).emit('pollEnded', { winner });
        }
    });

    socket.on('disconnect', () => {
        if (currentRoom && activeRooms[currentRoom] && !isRoleAdmin) {
            activeRooms[currentRoom].participants = Math.max(0, activeRooms[currentRoom].participants - 1);
            io.to(currentRoom).emit('updateParticipantCount', activeRooms[currentRoom].participants);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
});
