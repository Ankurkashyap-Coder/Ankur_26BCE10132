const socket = io();

const createPollSection = document.getElementById('create-poll-section');
const adminWaitingSection = document.getElementById('admin-waiting-section');
const adminResultsSection = document.getElementById('admin-results-section');
const addMoreQuestionsBtn = document.getElementById('add-more-questions-btn');
const dynamicQuestionsContainer = document.getElementById('dynamic-questions-container');
const createRoomBtn = document.getElementById('create-room-btn');
const displayRoomCode = document.getElementById('display-room-code');
const participantCount = document.getElementById('participant-count');
const startVotingBtn = document.getElementById('start-voting-btn');
const resultsQuestion = document.getElementById('results-question');
const resultsContainer = document.getElementById('results-container');
const totalVotesElement = document.getElementById('total-votes');
const endPollBtn = document.getElementById('end-poll-btn');

let questionCount = 1;

addMoreQuestionsBtn.addEventListener('click', () => {
    questionCount++;
    const block = document.createElement('div');
    block.className = 'question-block';
    block.style = 'border-bottom: 2px dashed #e2e8f0; margin-bottom: 20px; padding-bottom: 20px;';
    block.innerHTML = `
        <div class="form-group">
            <label>Question ${questionCount} Text:</label>
            <input type="text" class="poll-question" placeholder="Enter next question here">
        </div>
        <div class="form-group">
            <label>Options (Comma Separated):</label>
            <input type="text" class="poll-options-csv" placeholder="Option A, Option B, Option C">
        </div>
    `;
    dynamicQuestionsContainer.appendChild(block);
});

createRoomBtn.addEventListener('click', () => {
    const blocks = document.querySelectorAll('.question-block');
    const questionsArray = [];
    
    blocks.forEach(b => {
        const qText = b.querySelector('.poll-question').value.trim();
        const csvOptions = b.querySelector('.poll-options-csv').value.split(',');
        const optionsList = csvOptions.map(o => o.trim()).filter(o => o !== '');
        
        if (qText && optionsList.length >= 2) {
            questionsArray.push({ question: qText, options: optionsList });
        }
    });

    if (questionsArray.length < 1) {
        return alert('Please enter at least one fully complete question with at least 2 choices.');
    }

    socket.emit('createRoom', { questionsArray });
});

socket.on('roomCreated', (roomCode) => {
    createPollSection.classList.add('hidden');
    displayRoomCode.innerText = roomCode;
    adminWaitingSection.classList.remove('hidden');
});

socket.on('updateParticipantCount', (count) => {
    if(participantCount) participantCount.innerText = count;
});

startVotingBtn.addEventListener('click', () => {
    socket.emit('startVoting');
    adminWaitingSection.classList.add('hidden');
    adminResultsSection.classList.remove('hidden');
    resultsContainer.innerHTML = '<p style="text-align:center;">⌛ Generating countdown latency delay buffer...</p>';
});

socket.on('votingStarted', ({ question, options, currentIndex, totalQuestions }) => {
    resultsQuestion.innerText = `[Q${currentIndex + 1}/${totalQuestions}] ${question}`;
    resultsContainer.innerHTML = '';
    totalVotesElement.innerText = '0';
    endPollBtn.disabled = false;
    endPollBtn.innerText = (currentIndex < totalQuestions - 1) ? "Advance to Next Question" : "Conclude Quiz Session";
});

socket.on('liveResultsUpdate', ({ options, totalVotes }) => {
    totalVotesElement.innerText = totalVotes;
    resultsContainer.innerHTML = '';
    for (const [option, votes] of Object.entries(options)) {
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.innerHTML = `
            <div class="bar-label"><span>${option}</span><span>${votes} votes (${pct}%)</span></div>
            <div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div>
        `;
        resultsContainer.appendChild(wrapper);
    }
});

endPollBtn.addEventListener('click', () => {
    socket.emit('endPoll');
    endPollBtn.disabled = true;
    endPollBtn.innerText = "Processing State Change...";
});

socket.on('prepareNextQuestion', ({ nextIndex }) => {
    adminResultsSection.classList.add('hidden');
    adminWaitingSection.classList.remove('hidden');
    startVotingBtn.innerText = `Begin Next Question (Q${nextIndex + 1})`;
});

socket.on('pollEnded', () => {
    resultsQuestion.innerText = "🏁 Quiz Concluded Successfully!";
    resultsContainer.innerHTML = '<p style="color:var(--success); font-weight:bold; text-align:center;">All questions completed. Final aggregates saved to database cache layer.</p>';
    endPollBtn.innerText = "All Polls Closed";
});
