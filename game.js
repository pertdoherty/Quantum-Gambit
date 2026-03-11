/**
 * QUANTUM GAMBIT v1.3 - FULL STABLE RELEASE
 * Rules:
 * 1. Draw card to determine move power.
 * 2. Queen has randomized max distance.
 * 3. Capture ORIGINAL KING to win.
 * 4. Movement guides show valid paths.
 * 5. AI moves are highlighted with red borders.
 */

const boardElement = document.getElementById('board');
const cardElement = document.getElementById('role-card');
const roleText = document.getElementById('card-role-text');
const timerProgress = document.getElementById('timer-progress');

// Preload Sounds (Ganti URL jika ada file sendiri)
const flipSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2004/2004-preview.mp3');
const moveSound = new Audio('https://assets.mixkit.co/active_storage/sfx/206/206-preview.mp3');

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
    
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Set up Black (AI)
    for (let c = 0; c < 8; c++) {
        board[0][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: (c === 4) };
        board[1][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: false };
    }
    
    // Set up White (Player)
    for (let c = 0; c < 8; c++) {
        board[6][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: false };
        board[7][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: (c === 4) };
    }
    
    document.getElementById('current-player').innerText = "WHITE";
    renderBoard();
    startTimer();
}

// 2. Timer Management
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 15;
    if (timerProgress) timerProgress.style.width = '100%';
    
    timerInterval = setInterval(() => {
        if (gameOver) { clearInterval(timerInterval); return; }
        timeLeft--;
        if (timerProgress) timerProgress.style.width = (timeLeft / 15) * 100 + '%';
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Masa Tamat! Tukar giliran.");
            resetTurn();
        }
    }, 1000);
}

// 3. Drawing Cards
cardElement.onclick = () => {
    if (gameOver || isCardDrawn || currentTurn === 'black') return;
    drawCard();
};

function drawCard() {
    isCardDrawn = true;
    currentPower = ROLES[Math.floor(Math.random() * ROLES.length)];
    
    if (currentPower === 'QUEEN') {
        queenRange = Math.floor(Math.random() * 5) + 2; // Range 2-6
        roleText.innerHTML = `QUEEN<br><span style="font-size:12px;">Dist: ${queenRange}</span>`;
    } else {
        queenRange = 8;
        roleText.innerHTML = currentPower;
    }
    
    cardElement.classList.add('flipped');
    if (flipSound) flipSound.play();
}

// 4. Movement Logic
function handleSquareClick(r, c) {
    if (!isCardDrawn || gameOver) return;

    const piece = board[r][c];

    if (!selectedSquare) {
        if (piece && piece.side === currentTurn) {
            selectedSquare = { r, c };
            renderBoard();
            showGuides(r, c);
        }
    } else {
        if (isValidMove(selectedSquare.r, selectedSquare.c, r, c, currentPower)) {
            executeMove(selectedSquare.r, selectedSquare.c, r, c);
        } else {
            // Tukar selection jika klik kawan lain
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

function isValidMove(fR, fC, tR, tC, role) {
    const dr = tR - fR;
    const dc = tC - fC;
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    const targetPiece = board[tR][tC];

    if (targetPiece && targetPiece.side === currentTurn) return false;
    
    // Peraturan pergerakan asas
    switch (role) {
        case 'PAWN':
            const dir = currentTurn === 'white' ? -1 : 1;
            if (fC === tC && !targetPiece && dr === dir) return true;
            if (Math.abs(dc) === 1 && dr === dir && targetPiece) return true;
            return false;
        case 'KNIGHT':
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case 'ROOK':
            return (dr === 0 || dc === 0) && isPathClear(fR, fC, tR, tC);
        case 'BISHOP':
            return Math.abs(dr) === Math.abs(dc) && isPathClear(fR, fC, tR, tC);
        case 'QUEEN':
            if (dist > queenRange) return false;
            return (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) && isPathClear(fR, fC, tR, tC);
        case 'KING':
            return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
        default: return false;
    }
}

function isPathClear(fR, fC, tR, tC) {
    const stepR = tR === fR ? 0 : (tR > fR ? 1 : -1);
    const stepC = tC === fC ? 0 : (tC > fC ? 1 : -1);
    let curR = fR + stepR;
    let curC = fC + stepC;
    while (curR !== tR || curC !== tC) {
        if (board[curR][curC]) return false;
        curR += stepR; curC += stepC;
    }
    return true;
}

// 5. Visual Rendering
function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            sq.dataset.row = r; sq.dataset.col = c;
            
            const p = board[r][c];
            if (p) {
                sq.innerText = (p.isOriginalKing) ? PIECE_ICONS['KING'] : PIECE_ICONS[p.type];
                sq.style.color = p.side === 'white' ? '#ffcc00' : '#888';
                if (p.side === 'white' && p.type !== 'UNKNOWN') sq.style.textShadow = "0 0 8px #ffcc00";
            }

            if (selectedSquare && selectedSquare.r === r && selectedSquare.c === c) {
                sq.classList.add('highlight');
            }

            sq.onclick = () => handleSquareClick(r, c);
            boardElement.appendChild(sq);
        }
    }
}

function showGuides(r, c) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(sq => {
        const tr = parseInt(sq.dataset.row);
        const tc = parseInt(sq.dataset.col);
        if (isValidMove(r, c, tr, tc, currentPower)) {
            sq.classList.add('guide');
        }
    });
}

// 6. Turn Management
function executeMove(fR, fC, tR, tC) {
    const targetPiece = board[tR][tC];
    const movingPiece = board[fR][fC];

    // Win Check
    if (targetPiece && targetPiece.isOriginalKing) {
        gameOver = true;
        renderBoard();
        setTimeout(() => alert(`GAME OVER! PEMENANG: ${currentTurn.toUpperCase()}`), 200);
        return;
    }

    if (!movingPiece.isOriginalKing) movingPiece.type = currentPower;
    board[tR][tC] = movingPiece;
    board[fR][fC] = null;
    
    if (moveSound) moveSound.play();
    
    // Clear old AI trail, set new one
    document.querySelectorAll('.square').forEach(s => s.classList.remove('ai-last-move'));
    const destSq = document.querySelector(`[data-row="${tR}"][data-col="${tC}"]`);
    if (destSq) destSq.classList.add('ai-last-move');

    resetTurn();
}

function resetTurn() {
    clearInterval(timerInterval);
    selectedSquare = null;
    isCardDrawn = false;
    currentPower = null;
    cardElement.classList.remove('flipped');
    
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    document.getElementById('current-player').innerText = currentTurn.toUpperCase();
    
    renderBoard();
    if (!gameOver) {
        startTimer();
        if (currentTurn === 'black') setTimeout(aiMove, 1000);
    }
}

// 7. AI Logic
function aiMove() {
    if (gameOver) return;

    // AI Draw
    currentPower = ROLES[Math.floor(Math.random() * ROLES.length)];
    if (currentPower === 'QUEEN') queenRange = Math.floor(Math.random() * 5) + 2;
    else queenRange = 8;
    
    roleText.innerHTML = `${currentPower}${currentPower === 'QUEEN' ? '<br><small>D:'+queenRange+'</small>' : ''}`;
    cardElement.classList.add('flipped');
    isCardDrawn = true;

    let moves = [];
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            if(board[r][c] && board[r][c].side === 'black') {
                for(let tr=0; tr<8; tr++) {
                    for(let tc=0; tc<8; tc++) {
                        if(isValidMove(r, c, tr, tc, currentPower)) {
                            // Priority: Makan King Asal
                            if(board[tr][tc] && board[tr][tc].isOriginalKing) {
                                moves = [{fR: r, fC: c, tR: tr, tC: tc}];
                                r = 8; c = 8; break;
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

// Start Game
initBoard();
