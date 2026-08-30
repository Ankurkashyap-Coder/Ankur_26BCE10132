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
        // Rule: Displays “You're in, waiting for host to start.” 
        waitSection.classList.remove('hidden');
    } else if (state === 'voting') {
        showVotingScreen(question, options);
    } else {
        clientStatusMessage.innerText = "This poll has concluded.";
        clientResultsSection.classList.remove('hidden');
    }
});

// Rule: Server-pushed transition trigger catches update instantly without refresh
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
            // Rule: Instant confirmation feedback and disable buttons to block double voting
            disableVotingButtons();
        });
        voteOptionsBox.appendChild(btn);
    });
    voteSection.classList.remove('hidden');
}

function disableVotingButtons() {
    const buttons = voteOptionsBox.querySelectorAll('button');
    buttons.forEach(b => b.disabled = true);
    
    const feedback = document.createElement('p');
    feedback.innerText = "✓ Vote submitted successfully!";
    feedback.style = "color: var(--success); font-weight: 600; text-align: center; margin-top: 15px;";
    voteOptionsBox.appendChild(feedback);
    
    // Rule Checklist Recommendation: Transition users to see the exact same live-updating bar chart as the admin
    setTimeout(() => {
        voteSection.classList.add('hidden');
        clientResultsSection.classList.remove('hidden');
    }, 1200);
}

socket.on('liveResultsUpdate', ({ options, totalVotes }) => {
    renderBars(clientResultsContainer, options, totalVotes);
});

socket.on('pollEnded', ({ winner }) => {
    clientStatusMessage.innerHTML = `🏁 <strong>Poll Closed and Frozen!</strong> Winner: <span style="color:var(--success)">${winner}</span>`;
    const bars = clientResultsContainer.querySelectorAll('.bar-wrapper');
    bars.forEach(bar => {
        if(bar.getAttribute('data-opt') === winner) {
            bar.classList.add('winner');
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
            <div class="bar-label"><span>${option}</span><span>${votes} votes (${pct}%)</span></div>
            <div class="bar-container"><div class="bar-fill" style="width: ${pct}%"></div></div>
        `;
        container.appendChild(wrapper);
    }
}
