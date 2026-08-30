const socket = io();

const joinSection = document.getElementById('join-section');
const waitSection = document.getElementById('wait-section');
const voteSection = document.getElementById('vote-section');
const clientResultsSection = document.getElementById('client-results-section');
const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');
const joinError = document.getElementById('join-error');
const voteQuestion = document.getElementById('vote-question');
const voteOptionsBox = document.getElementById('vote-options-box');
const clientResultsContainer = document.getElementById('client-results-container');
const clientStatusMessage = document.getElementById('client-status-message');

joinBtn.addEventListener('click', () => {
    const code = roomInput.value.trim().toUpperCase();
    if(code) socket.emit('joinRoom', code);
});

socket.on('errorMsg', (msg) => { joinError.innerText = msg; });

socket.on('joinedRoomSuccessfully', ({ state, question, options }) => {
    joinSection.classList.add('hidden');
    if (state === 'waiting') {
        waitSection.classList.remove('hidden');
    } else if (state === 'voting') {
        showVotingScreen(question, options);
    } else {
        clientStatusMessage.innerText = "This poll has concluded.";
        clientResultsSection.classList.remove('hidden');
    }
});

socket.on('votingStarted', ({ question, options }) => {
    waitSection.classList.add('hidden');
    showVotingScreen(question, options);
});

function showVotingScreen(question, options) {
    voteQuestion.innerText = question;
    voteOptionsBox.innerHTML = '';
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.innerText = option;
        btn.addEventListener('click', () => {
            socket.emit('submitVote', option);
            disableVotingButtons();
        });
        voteOptionsBox.appendChild(btn);
    });
    voteSection.classList.remove('hidden');
}

function disableVotingButtons() {
    const buttons = voteOptionsBox.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);
    setTimeout(() => {
        voteSection.classList.add('hidden');
        clientResultsSection.classList.remove('hidden');
    }, 1200);
}

socket.on('liveResultsUpdate', ({ options, totalVotes }) => {
    renderBars(clientResultsContainer, options, totalVotes);
});

socket.on('pollEnded', ({ winner }) => {
    clientStatusMessage.innerHTML = `🏁 <strong>Poll closed!</strong> Winner: <span style="color:var(--success)">${winner}</span>`;
});

function renderBars(container, options, totalVotes) {
    container.innerHTML = '';
    for (const [option, votes] of Object.entries(options)) {
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        const wrapper = document.createElement('div');
        wrapper.className = 'bar-wrapper';
        wrapper.innerHTML = `
            <div class="bar-label"><span>${option}</span><span>${votes} votes (${pct}%)</span></div>
            <div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div>
        `;
        container.appendChild(wrapper);
    }
}
