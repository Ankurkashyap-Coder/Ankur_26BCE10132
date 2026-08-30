const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static UI files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for live rooms
const activeRooms = {};

io.on('connection', (socket) => {
    let currentRoom = null;
    let isRoleAdmin = false;

    // ADMIN: Create Poll & Init Room
    socket.on('createRoom', ({ question, options }) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase(); // Generates 5-letter code
        
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

    // PARTICIPANT: Try to Join Room
    socket.on('joinRoom', (roomCode) => {
        if (!activeRooms[roomCode]) {
            return socket.emit('errorMsg', 'Room not found. Check the code.');
        }

        currentRoom = roomCode;
        socket.join(roomCode);
        activeRooms[roomCode].participants += 1;

        // Notify everyone in the room (specifically admin) about new total user count
        io.to(roomCode).emit('updateParticipantCount', activeRooms[roomCode].participants);

        // Tell this specific participant what state the room is currently in
        socket.emit('joinedRoomSuccessfully', {
            state: activeRooms[roomCode].state,
            question: activeRooms[roomCode].question,
            options: Object.keys(activeRooms[roomCode].options)
        });
    });

    // ADMIN: Begin Voting Phase
    socket.on('startVoting', () => {
        if (isRoleAdmin && activeRooms[currentRoom]) {
            activeRooms[currentRoom].state = 'voting';
            // Force server-pushed transition to the participant UI without reloading
            io.to(currentRoom).emit('votingStarted', {
                question: activeRooms[currentRoom].question,
                options: Object.keys(activeRooms[currentRoom].options)
            });
        }
    });

    // PARTICIPANT: Submit Vote
    socket.on('submitVote', (selectedOption) => {
        if (activeRooms[currentRoom] && activeRooms[currentRoom].state === 'voting') {
            if (activeRooms[currentRoom].options[selectedOption] !== undefined) {
                activeRooms[currentRoom].options[selectedOption] += 1;
                activeRooms[currentRoom].totalVotes += 1;

                // Broadcast live up-to-date scores instantly to both Admin and Participants
                io.to(currentRoom).emit('liveResultsUpdate', {
                    options: activeRooms[currentRoom].options,
                    totalVotes: activeRooms[currentRoom].totalVotes
                });
            }
        }
    });

    // ADMIN: End Poll & Freeze Results
    socket.on('endPoll', () => {
        if (isRoleAdmin && activeRooms[currentRoom]) {
            activeRooms[currentRoom].state = 'ended';
            
            // Calculate winner
            const options = activeRooms[currentRoom].options;
            let winner = '';
            let maxVotes = -1;
            for (const [key, value] of Object.entries(options)) {
                if (value > maxVotes) {
                    maxVotes = value;
                    winner = key;
                }
            }

            io.to(currentRoom).emit('pollEnded', { winner });
        }
    });

    // CLEANUP: Track when client closes tab/disconnects
    socket.on('disconnect', () => {
        if (currentRoom && activeRooms[currentRoom]) {
            if (!isRoleAdmin) {
                activeRooms[currentRoom].participants = Math.max(0, activeRooms[currentRoom].participants - 1);
                io.to(currentRoom).emit('updateParticipantCount', activeRooms[currentRoom].participants);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
});
