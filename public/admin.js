const socket = io();

const createPollSection = document.getElementById('create-poll-section');
const adminWaitingSection = document.getElementById('admin-waiting-section');
const adminResultsSection = document.getElementById('admin-results-section');
const addOptionBtn = document.getElementById('add-option-btn');
const optionsContainer = document.getElementById('options-container');
const createRoomBtn = document.getElementById('create-room-btn');
const displayRoomCode = document.getElementById('display-room-code');
const participantCount = document.getElementById('participant-count');
const startVotingBtn = document.getElementById('start-voting-btn');
const resultsQuestion = document.getElementById('results-question');
const resultsContainer = document.getElementById('results-container');
const totalVotesElement = document.getElementById('total-votes');
const endPollBtn = document.getElementById('end-poll-btn');

// Rule: Enforce 2 to 6 choices maximum dynamically
addOptionBtn.addEventListener('click', () => {
    const currentCount = optionsContainer.querySelectorAll('input').length;
    if (currentCount < 6) {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'poll-option';
        input.placeholder = `Option ${currentCount + 1}`;
        optionsContainer.appendChild(input);
    }
    if (optionsContainer.querySelectorAll('input').length === 6) {
        addOptionBtn.disabled = true;
        addOptionBtn.innerText = "Maximum Options Reached (6)";
    }
});

createRoomBtn.addEventListener('click', () => {
    const question = document.getElementById('poll-question').value.trim();
    const inputs = optionsContainer.querySelectorAll('input');
    const options = [];
    
    inputs.forEach(i => { if(i.value.trim() !== '') options.push(i.value.trim()); });

    if (!question || options.length < 2) {
        return alert('Please write a question text and fill out at least 2 complete answer options.');
    }

    socket.emit('createRoom', { question, options });
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
    resultsQuestion.innerText = document.getElementById('poll-question').value;
    adminResultsSection.classList.remove('hidden');
});

socket.on('liveResultsUpdate', ({ options, totalVotes }) => {
    totalVotesElement.innerText = totalVotes;
    renderBars(resultsContainer, options, totalVotes);
});

endPollBtn.addEventListener('click', () => {
    socket.emit('endPoll');
    endPollBtn.disabled = true;
    endPollBtn.innerText = "Poll Concluded";
});

socket.on('pollEnded', ({ winner }) => {
    // Rule: Final Results locked/frozen. Highlight the winning option.
    const bars = resultsContainer.querySelectorAll('.bar-wrapper');
    bars.forEach(bar => {
        if(bar.getAttribute('data-opt') === winner) {
            bar.classList.add('winner'); // Turns the horizontal bar green via CSS rules
            const label = bar.querySelector('.bar-label span');
            label.innerHTML += ' 👑 (WINNER)';
        }
    });
});

function renderBars(container, options, totalVotes) {
    container.innerHTML = '';
    for (const [option, votes] of Object.entries(options)) {
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.setAttribute('data-opt', option);
        wrapper.innerHTML = `
            <div class="bar-label"><span><strong>${option}</strong></span><span>${votes} votes (${pct}%)</span></div>
            <div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div>
        `;
        container.appendChild(wrapper);
    }
}
