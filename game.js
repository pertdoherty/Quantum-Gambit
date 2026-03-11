/**
 * QUANTUM GAMBIT v1.5 - FINAL STABLE
 * Full logic with Modal, Instant Reveal, and AI fixes.
 */

const boardElement = document.getElementById('board');
const cardElement = document.getElementById('role-card');
const roleText = document.getElementById('card-role-text');
const timerProgress = document.getElementById('timer-progress');
const playerDisplay = document.getElementById('current-player');

// Sounds
const flipSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3');
const moveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/206/206-preview.mp3');

// Game State
let board = [];
let selectedSquare = null;
let currentTurn = 'white';
let currentPower = null; 
let queenRange = 8; 
let isCardDrawn = false;
let gameOver = false;
let timerInterval;
let timeLeft = 15;

const ROLES = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
const PIECE_ICONS = { 
    'PAWN': '♟', 'KNIGHT': '♞', 'BISHOP': '♝', 
    'ROOK': '♜', 'QUEEN': '♛', 'KING': '♚', 'UNKNOWN': '❓' 
};

// 1. Initialize Game
function initBoard() {
    clearInterval(timerInterval);
    gameOver = false;
    currentTurn = 'white';
    isCardDrawn = false;
    selectedSquare = null;
    currentPower = null;
    
    // Reset Board Data
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    for (let c = 0; c < 8; c++) {
        board[0][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: (c === 4) };
        board[1][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: false };
        board[6][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: false };
        board[7][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: (c === 4) };
    }
    
    // Reset UI
    if(playerDisplay) playerDisplay.innerText = "WHITE";
    cardElement.classList.remove('flipped');
    roleText.innerHTML = "?";
    document.getElementById('game-over-overlay').style.display = 'none';
    
    renderBoard();
    startTimer();
}

// 2. Timer
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 15;
    if (timerProgress) timerProgress.style.width = '100%';
    
    timerInterval = setInterval(() => {
        if (gameOver) return;
        timeLeft--;
        if (timerProgress) timerProgress.style.width = (timeLeft / 15) * 100 + '%';
        if (timeLeft <= 0) {
            alert("Masa Tamat!");
            resetTurn();
        }
    }, 1000);
}

// 3. Card Mechanics
cardElement.onclick = () => {
    if (gameOver || isCardDrawn || currentTurn === 'black') return;
    drawCard();
};

function drawCard() {
    isCardDrawn = true;
    currentPower = ROLES[Math.floor(Math.random() * ROLES.length)];
    
    if (currentPower === 'QUEEN') {
        queenRange = Math.floor(Math.random() * 5) + 2;
        roleText.innerHTML = `QUEEN<br><small>Limit: ${queenRange}</small>`;
    } else {
        queenRange = 8;
        roleText.innerHTML = currentPower;
    }
    
    cardElement.classList.add('flipped');
    flipSound.play().catch(() => {});
}

// 4. Click Handler
function handleSquareClick(r, c) {
    if (gameOver || currentTurn === 'black') return;
    if (!isCardDrawn) return alert("Klik kad dahulu!");

    const piece = board[r][c];

    if (!selectedSquare) {
        if (piece && piece.side === currentTurn) {
            selectedSquare = { r, c };
            renderBoard(); // Render untuk "Reveal" rupa buah
            showGuides(r, c);
        }
    } else {
        if (isValidMove(selectedSquare.r, selectedSquare.c, r, c, currentPower)) {
            executeMove(selectedSquare.r, selectedSquare.c, r, c);
        } else {
            // Tukar pilihan jika klik kawan sendiri yang lain
            if (piece && piece.side === currentTurn) {
                selectedSquare = { r, c };
                renderBoard();
                showGuides(r, c);
            } else {
                selectedSquare = null;
                renderBoard();
            }
        }
    }
}

// 5. Movement Validation
function isValidMove(fR, fC, tR, tC, role) {
    const dr = tR - fR;
    const dc = tC - fC;
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    const target = board[tR][tC];

    if (target && target.side === currentTurn) return false;
    if (role === 'QUEEN' && dist > queenRange) return false;

    switch (role) {
        case 'PAWN':
            const dir = currentTurn === 'white' ? -1 : 1;
            if (fC === tC && !target && dr === dir) return true;
            if (Math.abs(dc) === 1 && dr === dir && target) return true;
            return false;
        case 'KNIGHT':
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case 'ROOK':
            return (dr === 0 || dc === 0) && isPathClear(fR, fC, tR, tC);
        case 'BISHOP':
            return Math.abs(dr) === Math.abs(dc) && isPathClear(fR, fC, tR, tC);
        case 'QUEEN':
            return (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) && isPathClear(fR, fC, tR, tC);
        case 'KING':
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
        default: return false;
    }
}

function isPathClear(fR, fC, tR, tC) {
    const sR = tR === fR ? 0 : (tR > fR ? 1 : -1);
    const sC = tC === fC ? 0 : (tC > fC ? 1 : -1);
    let r = fR + sR, c = fC + sC;
    while (r !== tR || c !== tC) {
        if (board[r][c]) return false;
        r += sR; c += sC;
    }
    return true;
}

// 6. Execution & Rendering
function executeMove(fR, fC, tR, tC) {
    const target = board[tR][tC];
    const piece = board[fR][fC];

    if (target && target.isOriginalKing) {
        renderBoard();
        announceWinner(currentTurn);
        return;
    }

    if (!piece.isOriginalKing) piece.type = currentPower;
    board[tR][tC] = piece;
    board[fR][fC] = null;
    
    moveSound.play().catch(() => {});
    
    // Bersihkan trail lama & buat baru
    document.querySelectorAll('.square').forEach(s => s.classList.remove('ai-last-move'));
    resetTurn();
    
    const dest = document.querySelector(`[data-row="${tR}"][data-col="${tC}"]`);
    if (dest) dest.classList.add('ai-last-move');
}

function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            sq.dataset.row = r; sq.dataset.col = c;
            
            const p = board[r][c];
            if (p) {
                // Reveal rupa buah jika dipilih (Instant Reveal)
                let iconType = (selectedSquare && selectedSquare.r == r && selectedSquare.c == c) ? currentPower : p.type;
                sq.innerText = p.isOriginalKing ? PIECE_ICONS['KING'] : PIECE_ICONS[iconType];
                sq.style.color = p.side === 'white' ? '#ffcc00' : '#888';
            }

            if (selectedSquare && selectedSquare.r == r && selectedSquare.c == c) sq.classList.add('highlight');
            sq.onclick = () => handleSquareClick(r, c);
            boardElement.appendChild(sq);
        }
    }
}

function showGuides(r, c) {
    document.querySelectorAll('.square').forEach(sq => {
        if (isValidMove(r, c, parseInt(sq.dataset.row), parseInt(sq.dataset.col), currentPower)) {
            sq.classList.add('guide');
        }
    });
}

// 7. Turn & AI
function resetTurn() {
    clearInterval(timerInterval);
    selectedSquare = null;
    isCardDrawn = false;
    currentPower = null;
    cardElement.classList.remove('flipped');
    setTimeout(() => { if(!isCardDrawn) roleText.innerHTML = "?"; }, 300);

    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    if(playerDisplay) playerDisplay.innerText = currentTurn.toUpperCase();
    renderBoard();

    if (!gameOver) {
        startTimer();
        if (currentTurn === 'black') setTimeout(aiMove, 1200);
    }
}

function aiMove() {
    if (gameOver) return;
    isCardDrawn = true;
    currentPower = ROLES[Math.floor(Math.random() * ROLES.length)];
    if (currentPower === 'QUEEN') queenRange = Math.floor(Math.random() * 5) + 2;
    
    roleText.innerHTML = `${currentPower}${currentPower === 'QUEEN' ? '<br><small>D:'+queenRange+'</small>' : ''}`;
    cardElement.classList.add('flipped');

    let moves = [];
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            if(board[r][c] && board[r][c].side === 'black') {
                for(let tr=0; tr<8; tr++) {
                    for(let tc=0; tc<8; tc++) {
                        if(isValidMove(r, c, tr, tc, currentPower)) {
                            if(board[tr][tc] && board[tr][tc].isOriginalKing) {
                                moves = [{fR: r, fC: c, tR: tr, tC: tc}];
                                r=8; c=8; break;
                            }
                            moves.push({fR: r, fC: c, tR: tr, tC: tc});
                        }
                    }
                }
            }
        }
    }

    setTimeout(() => {
        if (moves.length > 0) {
            const m = moves[Math.floor(Math.random() * moves.length)];
            executeMove(m.fR, m.fC, m.tR, m.tC);
        } else {
            resetTurn();
        }
    }, 1200);
}

// 8. Game Over Logic
function announceWinner(winner) {
    gameOver = true;
    clearInterval(timerInterval);
    const overlay = document.getElementById('game-over-overlay');
    document.getElementById('winner-text').innerText = (winner === 'white') ? "YOU WIN! 🏆" : "AI WINS! 🤖";
    overlay.style.display = 'flex';
}

function restartGame() {
    initBoard();
}

initBoard();
