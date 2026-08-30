const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Multi-Question In-Memory Cache Store Map
const activeRooms = {};

io.on('connection', (socket) => {
    let currentRoom = null;
    let isRoleAdmin = false;

    // ADMIN: Create Poll with Multi-Question Input Array Support
    socket.on('createRoom', ({ questionsArray }) => {
        const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
        
        // Structure every question with its own low-latency vote tally tracker object
        const structuredQuestions = questionsArray.map(q => {
            const optionsObj = {};
            q.options.forEach(opt => { if(opt.trim() !== '') optionsObj[opt] = 0; });
            return {
                question: q.question,
                options: optionsObj,
                totalVotes: 0
            };
        });

        activeRooms[roomCode] = {
            questionsList: structuredQuestions,
            currentQuestionIndex: 0,
            state: 'waiting',
            participants: 0
        };

        currentRoom = roomCode;
        isRoleAdmin = true;
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    // PARTICIPANT: Join Room Router
    socket.on('joinRoom', (roomCode) => {
        if (!activeRooms[roomCode]) {
            return socket.emit('errorMsg', 'Room not found. Check the code.');
        }

        currentRoom = roomCode;
        socket.join(roomCode);
        activeRooms[roomCode].participants += 1;

        io.to(roomCode).emit('updateParticipantCount', activeRooms[roomCode].participants);

        const room = activeRooms[roomCode];
        const currentQ = room.questionsList[room.currentQuestionIndex];
        
        socket.emit('joinedRoomSuccessfully', {
            state: room.state,
            question: currentQ.question,
            options: Object.keys(currentQ.options),
            currentIndex: room.currentQuestionIndex,
            totalQuestions: room.questionsList.length
        });
    });

    // ADMIN: Trigger Delayed Safe Buffer Countdown Before Voting Goes Live
    socket.on('startVoting', () => {
        if (isRoleAdmin && activeRooms[currentRoom]) {
            const room = activeRooms[currentRoom];
            room.state = 'countdown';
            
            // Broadcast a 5-second server-pushed timer event down the websocket channel
            io.to(currentRoom).emit('countdownStarted', { seconds: 5 });

            setTimeout(() => {
                if (activeRooms[currentRoom]) {
                    room.state = 'voting';
                    const currentQ = room.questionsList[room.currentQuestionIndex];
                    
                    io.to(currentRoom).emit('votingStarted', {
                        question: currentQ.question,
                        options: Object.keys(currentQ.options),
                        currentIndex: room.currentQuestionIndex,
                        totalQuestions: room.questionsList.length
                    });
                }
            }, 5000);
        }
    });

    // PARTICIPANT: Process Incoming Stream Selection payload
    socket.on('submitVote', (selectedOption) => {
        if (activeRooms[currentRoom] && activeRooms[currentRoom].state === 'voting') {
            const room = activeRooms[currentRoom];
            const currentQ = room.questionsList[room.currentQuestionIndex];
            
            if (currentQ.options[selectedOption] !== undefined) {
                currentQ.options[selectedOption] += 1;
                currentQ.totalVotes += 1;

                io.to(currentRoom).emit('liveResultsUpdate', {
                    options: currentQ.options,
                    totalVotes: currentQ.totalVotes
                });
            }
        }
    });

    // ADMIN: Cycle Next Question Framework or Enforce Concluded Summary Screen State
    socket.on('endPoll', () => {
        if (isRoleAdmin && activeRooms[currentRoom]) {
            const room = activeRooms[currentRoom];
            
            // If there are more questions remaining in the list stack
            if (room.currentQuestionIndex < room.questionsList.length - 1) {
                room.currentQuestionIndex++;
                room.state = 'waiting';
                
                // Advance state globally and place users into next sequential waiting room
                io.to(currentRoom).emit('prepareNextQuestion', { 
                    nextIndex: room.currentQuestionIndex,
                    totalQuestions: room.questionsList.length
                });
            } else {
                // All items completed. Lock inputs permanently and send final overview statistics
                room.state = 'ended';
                io.to(currentRoom).emit('pollEnded', { finalSummary: room.questionsList });
            }
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
