let board = Array(9).fill(null)
let currentPlayer = 'X'
let gameMode = 'pvp'
let difficulty = 'easy'
let gameOver = false

let xScore = 0
let oScore = 0
let drawScore = 0

// ================= ELEMENTS =================
const homeScreen = document.getElementById('home-screen')
const modeScreen = document.getElementById('mode-screen')
const gameScreen = document.getElementById('game-screen')
const boardEl = document.getElementById('board')
const statusEl = document.getElementById('status')
const overlay = document.getElementById('overlay')

const xScoreEl = document.getElementById('x-score')
const oScoreEl = document.getElementById('o-score')
const drawScoreEl = document.getElementById('draw-score')


// ================= SCREEN SWITCH =================
function showScreen(screen){
    homeScreen.classList.remove('active')
    modeScreen.classList.remove('active')
    gameScreen.classList.remove('active')
    screen.classList.add('active')
}


// ================= RESET FUNCTION =================
function resetGame(fullReset){

    board = Array(9).fill(null)
    currentPlayer = 'X'
    gameOver = false

    renderBoard()
    updateStatus()

    // full reset includes scores
    if(fullReset){
        xScore = 0
        oScore = 0
        drawScore = 0
        updateScoreboard()
    }
}


// ================= NAV BUTTONS =================
document.getElementById('play-btn').onclick = () => {
    showScreen(modeScreen)
}

document.getElementById('back-btn').onclick = () => {
    showScreen(homeScreen)
}


// ================= DIFFICULTY =================
document.querySelectorAll('.diff-btn').forEach(btn=>{
    btn.onclick = () => {
        document.querySelectorAll('.diff-btn')
        .forEach(b=>b.classList.remove('active'))

        btn.classList.add('active')
        difficulty = btn.dataset.level
    }
})


// ================= GAME MODE (FIXED) =================
document.getElementById('pvp-btn').onclick = () => {
    gameMode = 'pvp'
    resetGame(true)   // reset board + scores
    showScreen(gameScreen)
}

document.getElementById('ai-btn').onclick = () => {
    gameMode = 'ai'
    resetGame(true)   // reset board + scores
    showScreen(gameScreen)
}


// ================= RENDER BOARD =================
function renderBoard(){

    boardEl.innerHTML = ''

    board.forEach((cell,i)=>{
        const div = document.createElement('div')
        div.className = 'cell'

        if(cell) div.classList.add(cell)

        div.textContent = cell || ''

        div.onclick = () => handleMove(i)

        boardEl.appendChild(div)
    })
}


// ================= HANDLE MOVE =================
async function handleMove(i){

    if(board[i] || gameOver) return

    board[i] = currentPlayer
    renderBoard()

    if(await checkGame()) return

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X'
    updateStatus()

    // ================= AI TURN =================
    if(gameMode === 'ai' && currentPlayer === 'O'){

        const res = await fetch('/api/ai-move', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body:JSON.stringify({
                board,
                difficulty
            })
        })

        const data = await res.json()

        board[data.index] = 'O'
        renderBoard()

        if(await checkGame()) return

        currentPlayer = 'X'
        updateStatus()
    }
}


// ================= CHECK GAME =================
async function checkGame(){

    const res = await fetch('/api/check',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({board})
    })

    const data = await res.json()

    if(data.result){

        gameOver = true

        // ================= SCORE UPDATE =================
        if(data.result === 'X'){
            xScore++
            statusEl.textContent = 'X Wins!'
        }
        else if(data.result === 'O'){
            oScore++
            statusEl.textContent =
                gameMode === 'ai' ? 'A.I Wins!' : 'O Wins!'
        }
        else{
            drawScore++
            statusEl.textContent = 'Draw!'
        }

        updateScoreboard()

        // ================= AUTO RESTART (KEEP SCORES) =================
        setTimeout(() => {
            resetGame(false)
        }, 1200)

        return true
    }

    return false
}


// ================= STATUS =================
function updateStatus(){

    if(gameMode === 'pvp'){
        statusEl.textContent = `Player ${currentPlayer} Turn`
    }
    else{
        statusEl.textContent =
            currentPlayer === 'X'
            ? 'Your Turn'
            : 'A.I Thinking...'
    }
}


// ================= SCOREBOARD =================
function updateScoreboard(){
    xScoreEl.textContent = xScore
    oScoreEl.textContent = oScore
    drawScoreEl.textContent = drawScore
}


// ================= OVERLAY =================
document.getElementById('pause-btn').onclick = () =>
    overlay.classList.add('active')

document.getElementById('resume-btn').onclick = () =>
    overlay.classList.remove('active')

document.getElementById('restart-btn').onclick = () => {
    overlay.classList.remove('active')
    resetGame(true)   // full reset (board + scores)
}

document.getElementById('exit-btn').onclick = () => {
    overlay.classList.remove('active')
    showScreen(homeScreen)
}