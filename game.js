/**
 * QUANTUM GAMBIT v1.4 - FIX STATE & VISUAL REVEAL
 */

const boardElement = document.getElementById('board');
const cardElement = document.getElementById('role-card');
const roleText = document.getElementById('card-role-text');
const timerProgress = document.getElementById('timer-progress');

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

function initBoard() {
    clearInterval(timerInterval);
    gameOver = false;
    currentTurn = 'white';
    isCardDrawn = false;
    selectedSquare = null;
    currentPower = null;
    
    board = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let c = 0; c < 8; c++) {
        board[0][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: (c === 4) };
        board[1][c] = { side: 'black', type: 'UNKNOWN', isOriginalKing: false };
        board[6][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: false };
        board[7][c] = { side: 'white', type: 'UNKNOWN', isOriginalKing: (c === 4) };
    }
    
    updateUIStatus();
    renderBoard();
    startTimer();
}

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

cardElement.onclick = () => {
    if (gameOver || isCardDrawn || currentTurn === 'black') return;
    drawCard();
};

function drawCard() {
    isCardDrawn = true;
    currentPower = ROLES[Math.floor(Math.random() * ROLES.length)];
    if (currentPower === 'QUEEN') {
        queenRange = Math.floor(Math.random() * 5) + 2;
        roleText.innerHTML = `QUEEN<br><small>Range: ${queenRange}</small>`;
    } else {
        queenRange = 8;
        roleText.innerHTML = currentPower;
    }
    cardElement.classList.add('flipped');
    flipSound.play().catch(e => {});
}

function handleSquareClick(r, c) {
    if (gameOver || currentTurn === 'black') return;
    if (!isCardDrawn) {
        alert("Sila cabut kad dahulu!");
        return;
    }

    const piece = board[r][c];

    // Case 1: Memilih buah
    if (!selectedSquare) {
        if (piece && piece.side === currentTurn) {
            selectedSquare = { r, c };
            // REVEAL INSTANT: Tukar rupa buah kepada power sekarang secara visual
            renderBoard(); 
            showGuides(r, c);
        }
    } 
    // Case 2: Memilih destinasi atau menukar buah
    else {
        if (isValidMove(selectedSquare.r, selectedSquare.c, r, c, currentPower)) {
            executeMove(selectedSquare.r, selectedSquare.c, r, c);
        } else {
            // Jika klik buah sendiri yang lain, tukar selection
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

function renderBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const sq = document.createElement('div');
            sq.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            sq.dataset.row = r; sq.dataset.col = c;
            
            const p = board[r][c];
            if (p) {
                // LOGIK REVEAL: Jika buah dipilih, tunjuk ikon power sekarang
                let iconType = p.type;
                if (selectedSquare && selectedSquare.r == r && selectedSquare.c == c) {
                    iconType = currentPower; 
                }
                
                sq.innerText = p.isOriginalKing ? PIECE_ICONS['KING'] : PIECE_ICONS[iconType];
                sq.style.color = p.side === 'white' ? '#ffcc00' : '#888';
            }

            if (selectedSquare && selectedSquare.r == r && selectedSquare.c == c) {
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

function isValidMove(fR, fC, tR, tC, role) {
    const dr = tR - fR;
    const dc = tC - fC;
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    const targetPiece = board[tR][tC];

    if (targetPiece && targetPiece.side === currentTurn) return false;
    
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

function executeMove(fR, fC, tR, tC) {
    const targetPiece = board[tR][tC];
    const movingPiece = board[fR][fC];

    if (targetPiece && targetPiece.isOriginalKing) {
        gameOver = true;
        renderBoard();
        setTimeout(() => alert(`GAME OVER! ${currentTurn.toUpperCase()} MENANG!`), 100);
        return;
    }

    if (!movingPiece.isOriginalKing) movingPiece.type = currentPower;
    board[tR][tC] = movingPiece;
    board[fR][fC] = null;
    
    moveSound.play().catch(e => {});
    
    // Simpan history AI move
    const lastR = tR, lastC = tC;
    resetTurn();
    
    // Highlighting petak mendarat
    setTimeout(() => {
        const dest = document.querySelector(`[data-row="${lastR}"][data-col="${lastC}"]`);
        if (dest) dest.classList.add('ai-last-move');
    }, 50);
}

function resetTurn() {
    clearInterval(timerInterval);
    selectedSquare = null;
    isCardDrawn = false;
    currentPower = null;
    
    // Flip balik kad
    cardElement.classList.remove('flipped');
    setTimeout(() => { roleText.innerHTML = "?"; }, 300);

    currentTurn = currentTurn === 'white' ? 'black' : 'white';
    updateUIStatus();
    renderBoard();

    if (!gameOver) {
        startTimer();
        if (currentTurn === 'black') setTimeout(aiMove, 1200);
    }
}

function updateUIStatus() {
    const turnDisplay = document.getElementById('current-player');
    if (turnDisplay) turnDisplay.innerText = currentTurn.toUpperCase();
}

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
    }, 1000);
}

initBoard();
