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

socket.on('joinedRoomSuccessfully', ({ state, question, options, currentIndex, totalQuestions }) => {
    joinSection.classList.add('hidden');
    if (state === 'waiting') {
        waitSection.classList.remove('hidden');
    } else if (state === 'voting') {
        showVotingScreen(question, options, currentIndex, totalQuestions);
    }
});

// SERVER-PUSHED EVENT 1: Handles Countdown Delay Buffer Before View Transforms
socket.on('countdownStarted', ({ seconds }) => {
    waitSection.classList.add('hidden');
    voteSection.classList.add('hidden');
    clientResultsSection.classList.remove('hidden');
    clientResultsContainer.innerHTML = '';
    
    let timeRemaining = seconds;
    clientStatusMessage.innerHTML = `⚠️ <strong>Get Ready!</strong> Voting starts in <span style="color:var(--primary); font-size:20px;">${timeRemaining}</span>s...`;
    
    const interval = setInterval(() => {
        timeRemaining--;
        if (timeRemaining <= 0) {
            clearInterval(interval);
        } else {
            clientStatusMessage.innerHTML = `⚠️ <strong>Get Ready!</strong> Voting starts in <span style="color:var(--primary); font-size:20px;">${timeRemaining}</span>s...`;
        }
    }, 1000);
});

// SERVER-PUSHED EVENT 2: Displays Interactive Sheet
socket.on('votingStarted', ({ question, options, currentIndex, totalQuestions }) => {
    clientResultsSection.classList.add('hidden');
    showVotingScreen(question, options, currentIndex, totalQuestions);
});

function showVotingScreen(question, options, currentIndex, totalQuestions) {
    voteQuestion.innerText = `[Q${currentIndex + 1}/${totalQuestions}] ${question}`;
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
    
    const feedback = document.createElement('p');
    feedback.innerText = "✓ Choice submitted successfully!";
    feedback.style = "color: var(--success); font-weight: 600; text-align: center; margin-top: 15px;";
    voteOptionsBox.appendChild(feedback);
    
    setTimeout(() => {
        voteSection.classList.add('hidden');
        clientResultsSection.classList.remove('hidden');
        clientStatusMessage.innerHTML = "📊 Vote logged. Awaiting live standings broadcast updates...";
    }, 1200);
}

socket.on('liveResultsUpdate', ({ options, totalVotes }) => {
    clientStatusMessage.innerHTML = "📊 Current live standings map summary below:";
    renderBars(clientResultsContainer, options, totalVotes);
});

socket.on('prepareNextQuestion', ({ nextIndex }) => {
    clientResultsSection.classList.add('hidden');
    waitSection.classList.remove('hidden');
});

// SERVER-PUSHED EVENT 3: Strips Out "In Progress" Feedback Text at Conclusion
socket.on('pollEnded', ({ finalSummary }) => {
    voteSection.classList.add('hidden');
    clientResultsSection.classList.remove('hidden');
    
    // Updates footer summary description card context layout cleanly
    clientStatusMessage.innerHTML = `🏁 <strong>Session Finished!</strong> Thank you for participating. All answers locked.`;
    clientResultsContainer.innerHTML = '<h3 style="margin-top:20px; border-bottom:1px solid var(--border); padding-bottom:8px;">Final Results Summary</h3>';
    
    finalSummary.forEach((q, idx) => {
        const block = document.createElement('div');
        block.style = 'margin-bottom: 20px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: #fafafa;';
        
        // Find highest vote choice option key label to call out structural winner
        let winningOpt = 'None';
        let highCount = -1;
        for (const [k, v] of Object.entries(q.options)) {
            if (v > highCount) { highCount = v; winningOpt = k; }
        }
        
        block.innerHTML = `
            <div style="font-weight:700; color:var(--text-main); margin-bottom:4px;">Q${idx + 1}: ${q.question}</div>
            <div style="font-size:14px; color:var(--text-muted)">Winner: <strong style="color:var(--success)">${winningOpt}</strong> (${highCount} votes)</div>
        `;
        clientResultsContainer.appendChild(block);
    });
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
