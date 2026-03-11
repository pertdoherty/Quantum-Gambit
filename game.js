/**
 * QUANTUM GAMBIT v1.2 - ADVANCED RULES
 */

const boardElement = document.getElementById('board');
const cardElement = document.getElementById('role-card');
const roleText = document.getElementById('card-role-text');
const timerProgress = document.getElementById('timer-progress');

let board = [];
let selectedSquare = null;
let currentTurn = 'white';
let currentPower = null; 
let queenRange = 8; // Random range untuk Queen
let isCardDrawn = false;
let gameOver = false;
let timerInterval;
let timeLeft = 15;

const ROLES = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
const PIECE_ICONS = { 'PAWN': '♟', 'KNIGHT': '♞', 'BISHOP': '♝', 'ROOK': '♜', 'QUEEN': '♛', 'KING': '♚', 'UNKNOWN': '❓' };

function initBoard() {
    gameOver = false;
    currentTurn = 'white';
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let c = 0; c < 8; c++) {
        board[0][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: (c === 4) };
        board[1][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: false };
        board[6][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: false };
        board[7][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: (c === 4) };
    }
    renderBoard();
    startTimer();
}

// 1. Timer Logic
function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 15;
    timerProgress.style.width = '100%';
    timerInterval = setInterval(() => {
        timeLeft--;
        timerProgress.style.width = (timeLeft / 15) * 100 + '%';
        if (timeLeft <= 0) {
            alert("Masa tamat! Tukar turn.");
            resetTurn();
        }
    }, 1000);
}

// 2. Draw Card with Queen Logic
cardElement.onclick = () => {
    if (gameOver || isCardDrawn || currentTurn === 'black') return;
    drawCard();
};

function drawCard() {
    isCardDrawn = true;
    currentPower = ROLES[Math.floor(Math.random() * ROLES.length)];
    
    let extraText = "";
    if (currentPower === 'QUEEN') {
        queenRange = Math.floor(Math.random() * 5) + 2; // Range 2-7
        extraText = ` (Max: ${queenRange})`;
    } else {
        queenRange = 8;
    }
    
    roleText.innerHTML = `${currentPower}<br><span class="queen-range">${extraText}</span>`;
    cardElement.classList.add('flipped');
}

// 3. Movement Guide
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

function handleSquareClick(r, c) {
    if (!isCardDrawn) return;

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
            selectedSquare = null;
            renderBoard();
        }
    }
}

function isValidMove(fR, fC, tR, tC, role) {
    const dr = tR - fR;
    const dc = tC - fC;
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    const targetPiece = board[tR][tC];

    if (targetPiece && targetPiece.side === currentTurn) return false;
    
    // Queen Limit Check
    if (role === 'QUEEN' && dist > queenRange) return false;

    // Standard Chess Logic (Sama seperti sebelum ini)
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

function executeMove(fR, fC, tR, tC) {
    const targetPiece = board[tR][tC];
    const movingPiece = board[fR][fC];

    // Check Win: Hanya Original King
    if (targetPiece && targetPiece.isOriginalKing) {
        gameOver = true;
        renderBoard();
        alert(`GAME OVER! ${currentTurn.toUpperCase()} MENANG!`);
        return;
    }

    // Update Piece Type (Kecuali Original King kekal rupa King)
    if (!movingPiece.isOriginalKing) movingPiece.type = currentPower;

    board[tR][tC] = movingPiece;
    board[fR][fC] = null;
    
    // Clear AI indicators
    document.querySelectorAll('.square').forEach(s => s.classList.remove('ai-last-move'));
    
    // Mark last move
    document.querySelector(`[data-row="${tR}"][data-col="${tc}"]`)?.classList.add('ai-last-move');

    resetTurn();
}

function resetTurn() {
    selectedSquare = null;
    isCardDrawn = false;
    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    cardElement.classList.remove('flipped');
    renderBoard();
    startTimer();
    if (currentTurn === 'black' && !gameOver) setTimeout(aiMove, 1000);
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
                sq.innerText = (p.isOriginalKing) ? PIECE_ICONS['KING'] : PIECE_ICONS[p.type];
                sq.style.color = p.side === 'white' ? '#ffcc00' : '#888';
            }
            sq.onclick = () => !gameOver && handleSquareClick(r, c);
            boardElement.appendChild(sq);
        }
    }
}

// 4. AI with Visibility
function aiMove() {
    drawCard(); 
    let moves = [];
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            if(board[r][c] && board[r][c].side === 'black') {
                for(let tr=0; tr<8; tr++) {
                    for(let tc=0; tc<8; tc++) {
                        if(isValidMove(r, c, tr, tc, currentPower)) {
                            moves.push({fR: r, fC: c, tR: tr, tC: tc});
                        }
                    }
                }
            }
        }
    }
    if (moves.length > 0) {
        const m = moves[Math.floor(Math.random() * moves.length)];
        // Highlight AI move sebelum jalan
        const sq = document.querySelector(`[data-row="${m.fR}"][data-col="${m.fC}"]`);
        sq.classList.add('highlight');
        setTimeout(() => executeMove(m.fR, m.fC, m.tR, m.tC), 500);
    } else {
        resetTurn();
    }
}

initBoard();
