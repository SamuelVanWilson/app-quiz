// ===== GLOBAL STATE =====
const AppState = {
    testTitle: '',
    globalDuration: 0,
    instinctDuration: 0,
    beepEnabled: true,
    questions: [],
    currentPhase: 'setup',
    currentQuestionIndex: 0,
    globalTimeRemaining: 0,
    instinctTimeRemaining: 0,
    beepCount: 0,
    testStartTime: null,
    audioContext: null,
    globalTimerInterval: null,
    instinctTimerInterval: null,
    selectedAnswer: null
};

// ===== EVENT LISTENERS INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Setup Form
    document.getElementById('setupForm').addEventListener('submit', handleSetupSubmit);

    // Import Phase Buttons
    document.getElementById('backToSetupBtn').addEventListener('click', goToSetup);
    document.getElementById('parseQuestionsBtn').addEventListener('click', parseQuestions);
    document.getElementById('clearBulkTextBtn').addEventListener('click', clearBulkText);
    document.getElementById('addManualQuestionBtn').addEventListener('click', addManualQuestion);
    document.getElementById('startTestBtn').addEventListener('click', startTest);

    // Testing Phase Buttons
    document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);

    // Results Phase Buttons
    document.getElementById('downloadMarkdownBtn').addEventListener('click', downloadMarkdown);
    document.getElementById('copyToClipboardBtn').addEventListener('click', copyToClipboard);
    document.getElementById('newTestBtn').addEventListener('click', newTest);
});

// ===== PHASE TRANSITIONS =====
function showPhase(phaseName) {
    document.getElementById('setupPhase').classList.add('hidden');
    document.getElementById('importPhase').classList.add('hidden');
    document.getElementById('testingPhase').classList.add('hidden');
    document.getElementById('resultPhase').classList.add('hidden');

    document.getElementById(phaseName + 'Phase').classList.remove('hidden');
    AppState.currentPhase = phaseName;
}

function goToSetup() {
    // Repopulate form with current values
    document.getElementById('testTitle').value = AppState.testTitle;
    document.getElementById('globalDuration').value = AppState.globalDuration;
    document.getElementById('instinctDuration').value = AppState.instinctDuration;
    document.getElementById('beepEnabled').checked = AppState.beepEnabled;

    showPhase('setup');
}

// ===== SETUP PHASE =====
document.getElementById('setupForm').addEventListener('submit', (e) => {
    e.preventDefault();

    AppState.testTitle = document.getElementById('testTitle').value;
    AppState.globalDuration = parseInt(document.getElementById('globalDuration').value);
    AppState.instinctDuration = parseInt(document.getElementById('instinctDuration').value);
    AppState.beepEnabled = document.getElementById('beepEnabled').checked;

    showPhase('import');
});

// ===== IMPORT PHASE =====
function parseQuestions() {
    const text = document.getElementById('bulkImportText').value.trim();
    if (!text) {
        showError('Teks tidak boleh kosong!');
        return;
    }

    const lines = text.split('\n').filter(line => line.trim());
    let parsed = 0;

    lines.forEach((line, idx) => {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);

        if (parts.length < 3) {
            showError(`Baris ${idx + 1}: Format tidak valid. Minimal harus ada pertanyaan dan 2 opsi.`);
            return;
        }

        const question = {
            id: Date.now() + idx,
            question: parts[0],
            options: parts.slice(1),
            userAnswer: null,
            correctAnswer: 0, // Default correct answer (for demo, not used in marking)
            isCorrect: null
        };

        AppState.questions.push(question);
        parsed++;
    });

    if (parsed > 0) {
        hideError();
        updateQuestionsList();
        document.getElementById('bulkImportText').value = '';

        // Show success message
        const successMsg = `✅ Berhasil menambahkan ${parsed} soal!`;
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.classList.remove('hidden', 'bg-red-100', 'border-red-500', 'text-red-700');
        errorDiv.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
        document.getElementById('errorText').textContent = successMsg;

        // Hide success message after 3 seconds
        setTimeout(() => {
            errorDiv.classList.add('hidden');
            errorDiv.classList.remove('bg-green-100', 'border-green-500', 'text-green-700');
            errorDiv.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
        }, 3000);
    }
}

function clearBulkText() {
    document.getElementById('bulkImportText').value = '';
}

function addManualQuestion() {
    const question = prompt('Masukkan pertanyaan:');
    if (!question) return;

    const optionsText = prompt('Masukkan opsi jawaban (pisah dengan |):\nContoh: Opsi A | Opsi B | Opsi C');
    if (!optionsText) return;

    const options = optionsText.split('|').map(o => o.trim()).filter(o => o);
    if (options.length < 2) {
        alert('Minimal harus ada 2 opsi jawaban!');
        return;
    }

    AppState.questions.push({
        id: Date.now(),
        question: question,
        options: options,
        userAnswer: null,
        correctAnswer: 0,
        isCorrect: null
    });

    updateQuestionsList();

    // Show success message
    const successMsg = `✅ Soal berhasil ditambahkan!`;
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.classList.remove('hidden', 'bg-red-100', 'border-red-500', 'text-red-700');
    errorDiv.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
    document.getElementById('errorText').textContent = successMsg;

    // Hide success message after 3 seconds
    setTimeout(() => {
        errorDiv.classList.add('hidden');
        errorDiv.classList.remove('bg-green-100', 'border-green-500', 'text-green-700');
        errorDiv.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
    }, 3000);
}

function updateQuestionsList() {
    const container = document.getElementById('questionsList');
    const count = document.getElementById('questionCount');

    count.textContent = AppState.questions.length;

    if (AppState.questions.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-8">Belum ada soal. Gunakan bulk import atau tambah manual.</p>';
        document.getElementById('startTestBtn').disabled = true;
        return;
    }

    container.innerHTML = AppState.questions.map((q, idx) => `
        <div class="question-item bg-white p-4 rounded-lg border-l-4">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <p class="font-bold text-purple-600 mb-1">Soal ${idx + 1}</p>
                    <p class="text-gray-800 font-semibold mb-2">${q.question}</p>
                    <div class="flex flex-wrap gap-2">
                        ${q.options.map((opt, i) => `
                            <span class="text-sm bg-gray-100 px-3 py-1 rounded-full">${String.fromCharCode(65 + i)}. ${opt}</span>
                        `).join('')}
                    </div>
                </div>
                <button class="delete-question-btn text-red-500 hover:text-red-700 ml-4" data-question-id="${q.id}">
                    <svg class="icon"><use href="#icon-trash"/></svg>
                </button>
            </div>
        </div>
    `).join('');

    // Attach event listeners to delete buttons
    document.querySelectorAll('.delete-question-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteQuestion(parseInt(btn.dataset.questionId)));
    });

    document.getElementById('startTestBtn').disabled = false;
}

function deleteQuestion(id) {
    if (confirm('Hapus soal ini?')) {
        AppState.questions = AppState.questions.filter(q => q.id !== id);
        updateQuestionsList();
    }
}

function showError(msg) {
    document.getElementById('errorMessage').classList.remove('hidden');
    document.getElementById('errorText').textContent = msg;
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

// ===== TESTING PHASE =====
function startTest() {
    if (AppState.questions.length === 0) {
        alert('Belum ada soal!');
        return;
    }

    // Initialize Audio Context (user interaction required)
    if (!AppState.audioContext) {
        try {
            AppState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext initialized successfully');
        } catch (e) {
            console.error('Web Audio API not supported', e);
            if (AppState.beepEnabled) {
                alert('⚠️ Browser Anda tidak mendukung notifikasi suara. Beep alert akan dinonaktifkan.');
                AppState.beepEnabled = false;
            }
        }
    }

    // Log beep status
    console.log('Beep enabled:', AppState.beepEnabled);

    // Reset state
    AppState.currentQuestionIndex = 0;
    AppState.beepCount = 0;
    AppState.globalTimeRemaining = AppState.globalDuration * 60; // convert to seconds
    AppState.testStartTime = Date.now();
    AppState.selectedAnswer = null;

    // Reset all question answers
    AppState.questions.forEach(q => {
        q.userAnswer = null;
        q.isCorrect = null;
    });

    showPhase('testing');
    document.getElementById('testTitleDisplay').textContent = AppState.testTitle;

    startGlobalTimer();
    loadQuestion();
}

function startGlobalTimer() {
    updateGlobalTimer();
    AppState.globalTimerInterval = setInterval(() => {
        AppState.globalTimeRemaining--;
        updateGlobalTimer();

        if (AppState.globalTimeRemaining <= 0) {
            endTest();
        }
    }, 1000);
}

function updateGlobalTimer() {
    const mins = Math.floor(AppState.globalTimeRemaining / 60);
    const secs = AppState.globalTimeRemaining % 60;
    document.getElementById('globalTimer').textContent =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const totalSeconds = AppState.globalDuration * 60;
    const percentage = (AppState.globalTimeRemaining / totalSeconds) * 100;
    document.getElementById('globalProgress').style.width = percentage + '%';
}

function loadQuestion() {
    const q = AppState.questions[AppState.currentQuestionIndex];

    document.getElementById('currentQuestionNum').textContent = AppState.currentQuestionIndex + 1;
    document.getElementById('questionText').textContent = q.question;
    document.getElementById('questionProgress').textContent =
        `${AppState.currentQuestionIndex + 1} dari ${AppState.questions.length}`;

    // Load answers
    const container = document.getElementById('answersContainer');
    container.innerHTML = q.options.map((opt, idx) => `
        <button class="answer-btn w-full text-left px-6 py-4 bg-white rounded-lg font-semibold text-gray-800 hover:shadow-lg"
            data-idx="${idx}">
            <span class="inline-block w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-center leading-8 mr-3 font-bold">
                ${String.fromCharCode(65 + idx)}
            </span>
            ${opt}
        </button>
    `).join('');

    // Attach event listeners to answer buttons
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.idx)));
    });

    // Reset selected answer
    AppState.selectedAnswer = null;
    document.getElementById('nextQuestionBtn').disabled = true;
    document.getElementById('nextBtnText').textContent = 'Pilih Jawaban';

    // Update next button text
    if (AppState.currentQuestionIndex === AppState.questions.length - 1) {
        document.getElementById('nextBtnText').textContent = 'Submit Tes';
    }

    // Start instinct timer
    startInstinctTimer();
}

function startInstinctTimer() {
    // Stop existing timer
    if (AppState.instinctTimerInterval) {
        clearInterval(AppState.instinctTimerInterval);
    }

    AppState.instinctTimeRemaining = AppState.instinctDuration;
    const progressBar = document.getElementById('instinctProgress');
    progressBar.style.width = '0%';
    progressBar.className = 'instinct-bar bg-gradient-to-r from-green-400 to-green-500 h-full';

    let elapsed = 0;
    AppState.instinctTimerInterval = setInterval(() => {
        elapsed++;
        const percentage = (elapsed / AppState.instinctDuration) * 100;
        progressBar.style.width = Math.min(percentage, 100) + '%';

        // Change color based on progress
        if (percentage >= 100) {
            progressBar.className = 'instinct-bar danger h-full';
            playBeep();
            AppState.beepCount++;
            document.getElementById('beepCounter').textContent = AppState.beepCount;
            clearInterval(AppState.instinctTimerInterval);
        } else if (percentage >= 75) {
            progressBar.className = 'instinct-bar danger h-full';
        } else if (percentage >= 50) {
            progressBar.className = 'instinct-bar warning h-full';
        }
    }, 1000);
}

function selectAnswer(idx) {
    AppState.selectedAnswer = idx;
    AppState.questions[AppState.currentQuestionIndex].userAnswer = idx;

    // Update UI
    document.querySelectorAll('.answer-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    document.querySelector(`[data-idx="${idx}"]`).classList.add('selected');

    document.getElementById('nextQuestionBtn').disabled = false;
    if (AppState.currentQuestionIndex === AppState.questions.length - 1) {
        document.getElementById('nextBtnText').textContent = 'Submit Tes';
    } else {
        document.getElementById('nextBtnText').textContent = 'Soal Berikutnya';
    }
}

function nextQuestion() {
    if (AppState.selectedAnswer === null) return;

    // Stop instinct timer
    if (AppState.instinctTimerInterval) {
        clearInterval(AppState.instinctTimerInterval);
    }

    // Move to next question or end test
    if (AppState.currentQuestionIndex < AppState.questions.length - 1) {
        AppState.currentQuestionIndex++;
        loadQuestion();
    } else {
        endTest();
    }
}

function endTest() {
    // Stop timers
    if (AppState.globalTimerInterval) clearInterval(AppState.globalTimerInterval);
    if (AppState.instinctTimerInterval) clearInterval(AppState.instinctTimerInterval);

    // Calculate results (for this demo, we'll mark randomly as correct/incorrect)
    // In a real scenario, you'd have correct answers defined
    AppState.questions.forEach(q => {
        if (q.userAnswer !== null) {
            // For demo: first option is always "correct" or random
            q.isCorrect = Math.random() > 0.3; // 70% correct rate for demo
        }
    });

    showResults();
}

// ===== AUDIO FUNCTION =====
function playBeep() {
    if (!AppState.beepEnabled) {
        console.log('Beep skipped: beep is disabled');
        return;
    }

    if (!AppState.audioContext) {
        console.log('Beep skipped: no audio context');
        return;
    }

    try {
        console.log('🔊 Playing beep sound...');
        const oscillator = AppState.audioContext.createOscillator();
        const gainNode = AppState.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(AppState.audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, AppState.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, AppState.audioContext.currentTime + 0.3);

        oscillator.start(AppState.audioContext.currentTime);
        oscillator.stop(AppState.audioContext.currentTime + 0.3);
    } catch (e) {
        console.error('Error playing beep:', e);
    }
}

// ===== RESULTS PHASE =====
function showResults() {
    showPhase('result');

    const correctCount = AppState.questions.filter(q => q.isCorrect).length;
    const totalCount = AppState.questions.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    document.getElementById('resultTestTitle').textContent = AppState.testTitle;
    document.getElementById('accuracyDisplay').textContent = accuracy + '%';
    document.getElementById('scoreDisplay').textContent = `${correctCount}/${totalCount} benar`;

    const mins = Math.floor(AppState.globalTimeRemaining / 60);
    const secs = AppState.globalTimeRemaining % 60;
    document.getElementById('timeRemainingDisplay').textContent =
        `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    document.getElementById('beepTotalDisplay').textContent = AppState.beepCount;

    // Detailed review
    const reviewContainer = document.getElementById('detailedReview');
    reviewContainer.innerHTML = AppState.questions.map((q, idx) => {
        const userAnswerText = q.userAnswer !== null ? q.options[q.userAnswer] : 'Tidak dijawab';
        const isCorrect = q.isCorrect;
        const statusIcon = isCorrect ?
            '<svg class="icon text-green-500"><use href="#icon-check"/></svg>' :
            '<svg class="icon text-red-500"><use href="#icon-close"/></svg>';
        const statusClass = isCorrect ? 'border-green-500' : 'border-red-500';

        return `
            <div class="bg-white p-4 rounded-lg border-l-4 ${statusClass}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <p class="font-bold text-gray-700 mb-2">Soal ${idx + 1}: ${q.question}</p>
                        <p class="text-sm">
                            <span class="font-semibold">Jawaban Anda:</span> 
                            <span class="${isCorrect ? 'text-green-600' : 'text-red-600'}">${userAnswerText}</span>
                        </p>
                    </div>
                    ${statusIcon}
                </div>
            </div>
        `;
    }).join('');
}

function generateMarkdown() {
    const correctCount = AppState.questions.filter(q => q.isCorrect).length;
    const totalCount = AppState.questions.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

    const mins = Math.floor(AppState.globalTimeRemaining / 60);
    const secs = AppState.globalTimeRemaining % 60;
    const timeRemaining = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const now = new Date().toLocaleString('id-ID');

    let md = `# ${AppState.testTitle}\n\n`;
    md += `**Tanggal Tes**: ${now}\n`;
    md += `**Durasi**: ${AppState.globalDuration} menit\n`;
    md += `**Total Soal**: ${totalCount}\n\n`;
    md += `## Ringkasan Performa\n\n`;
    md += `- **Akurasi**: ${correctCount}/${totalCount} (${accuracy}%)\n`;
    md += `- **Sisa Waktu**: ${timeRemaining}\n`;
    md += `- **Beep Violations**: ${AppState.beepCount} kali\n\n`;
    md += `## Detail Hasil\n\n`;

    AppState.questions.forEach((q, idx) => {
        const userAnswerText = q.userAnswer !== null ? q.options[q.userAnswer] : 'Tidak dijawab';
        const status = q.isCorrect ? '✅' : '❌';

        md += `### Soal ${idx + 1}: ${q.question}\n\n`;
        md += `- **Jawaban Anda**: ${userAnswerText} ${status}\n`;
        md += `- **Opsi**: ${q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join(' | ')}\n\n`;
    });

    md += `---\n*Generated by Custom Quiz Engine*\n`;

    return md;
}

function downloadMarkdown() {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${AppState.testTitle.replace(/[^a-z0-9]/gi, '_')}_hasil.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyToClipboard() {
    const markdown = generateMarkdown();
    navigator.clipboard.writeText(markdown).then(() => {
        alert('Hasil berhasil disalin ke clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Gagal menyalin ke clipboard');
    });
}

function newTest() {
    if (confirm('Mulai tes baru? Data tes sekarang akan hilang.')) {
        AppState.questions = [];
        AppState.currentQuestionIndex = 0;
        AppState.beepCount = 0;
        AppState.selectedAnswer = null;
        showPhase('setup');
    }
}
