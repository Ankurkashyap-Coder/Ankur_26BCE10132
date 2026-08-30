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

addOptionBtn.addEventListener('click', () => {
    const currentOptionsCount = optionsContainer.querySelectorAll('input').length;
    if (currentOptionsCount < 6) {
        const input = document.createElement('input'); input.type = 'text'; input.className = 'poll-option'; input.placeholder = `Option ${currentOptionsCount + 1}`;
        optionsContainer.appendChild(input);
    }
    if (optionsContainer.querySelectorAll('input').length === 6) addOptionBtn.disabled = true;
});
createRoomBtn.addEventListener('click', () => {
    const question = document.getElementById('poll-question').value.trim();
    const inputs = optionsContainer.querySelectorAll('input'); const options = [];
    inputs.forEach(i => { if(i.value.trim()) options.push(i.value.trim()); });
    if (!question || options.length < 2) return alert('Please write a question and add at least 2 complete options.');
    socket.emit('createRoom', { question, options });
});
socket.on('roomCreated', (roomCode) => { createPollSection.classList.add('hidden'); displayRoomCode.innerText = roomCode; adminWaitingSection.classList.remove('hidden'); });
socket.on('updateParticipantCount', (count) => { if(participantCount) participantCount.innerText = count; });
startVotingBtn.addEventListener('click', () => { socket.emit('startVoting'); adminWaitingSection.classList.add('hidden'); resultsQuestion.innerText = document.getElementById('poll-question').value; adminResultsSection.classList.remove('hidden'); });
socket.on('liveResultsUpdate', ({ options, totalVotes }) => {
    totalVotesElement.innerText = totalVotes; resultsContainer.innerHTML = '';
    for (const [option, votes] of Object.entries(options)) {
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const wrapper = document.createElement('div'); wrapper.className = 'bar-wrapper'; wrapper.setAttribute('data-opt', option);
        wrapper.innerHTML = `<div class="bar-label"><span>${option}</span><span>${votes} votes (${pct}%)</span></div><div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div>`;
        resultsContainer.appendChild(wrapper);
    }
});
endPollBtn.addEventListener('click', () => { socket.emit('endPoll'); endPollBtn.disabled = true; endPollBtn.innerText = "Poll Closed"; });
socket.on('pollEnded', ({ winner }) => {
    const bars = resultsContainer.querySelectorAll('.bar-wrapper');
    bars.forEach(bar => { if(bar.getAttribute('data-opt') === winner) bar.classList.add('winner'); });
});
