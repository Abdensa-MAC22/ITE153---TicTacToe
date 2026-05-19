let board = Array(9).fill(null)

let currentPlayer = 'X'
let gameMode = 'pvp'
let difficulty = 'easy'
let gameOver = false

// ================= LOSER STARTS NEXT =================
let lastWinner = null

// ================= MATCH TARGET =================
const WIN_TARGET = 3

// ================= SCORES =================
let xScore = 0
let oScore = 0
let drawScore = 0

// ================= MUSIC =================
const bgMusic = new Audio("/static/sounds/Audio.mp3")

bgMusic.loop = true
bgMusic.volume = 0.2

let musicStarted = false

document.addEventListener("click", () => {

    if (!musicStarted) {

        bgMusic.play()
        musicStarted = true
    }

}, { once: true })

// ================= SOUNDS =================
const clickSound = new Audio("/static/sounds/click.mp3")
const winSound = new Audio("/static/sounds/win.mp3")
const loseSound = new Audio("/static/sounds/lose.mp3")
const drawSound = new Audio("/static/sounds/draw.mp3")

clickSound.volume = 0.6
winSound.volume = 0.8
loseSound.volume = 0.8
drawSound.volume = 0.7

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

// ================= CREATE WINNER POPUP =================
const winnerPopup = document.createElement('div')

winnerPopup.className = 'winner-popup'

winnerPopup.innerHTML = `
    <div class="winner-box">
        <h1 id="winner-title">Winner</h1>
        <button id="winner-btn">Continue</button>
    </div>
`

document.body.appendChild(winnerPopup)

const winnerTitle =
    document.getElementById('winner-title')

const winnerBtn =
    document.getElementById('winner-btn')

// ================= POPUP STYLE =================
const popupStyle = document.createElement('style')

popupStyle.innerHTML = `

.winner-popup{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.7);
    display:none;
    justify-content:center;
    align-items:center;
    z-index:9999;
    backdrop-filter:blur(8px);
}

.winner-box{
    width:320px;
    padding:30px;
    border-radius:28px;
    background:#111;
    border:1px solid rgba(255,255,255,0.08);
    text-align:center;
    animation:popup 0.3s ease;
}

.winner-box h1{
    margin-bottom:20px;
    font-size:32px;
    color:white;
}

.winner-box button{
    width:100%;
    padding:14px;
    border:none;
    border-radius:14px;
    background:white;
    color:black;
    font-weight:700;
    cursor:pointer;
}

@keyframes popup{
    from{
        transform:scale(0.8);
        opacity:0;
    }
    to{
        transform:scale(1);
        opacity:1;
    }
}

`

document.head.appendChild(popupStyle)

// ================= SHOW POPUP =================
function showWinnerPopup(text){

    winnerTitle.textContent = text

    winnerPopup.style.display = 'flex'
}

// ================= CLOSE POPUP =================
winnerBtn.onclick = () => {

    winnerPopup.style.display = 'none'
}

// ================= SCREEN SWITCH =================
function showScreen(screen){

    homeScreen.classList.remove('active')
    modeScreen.classList.remove('active')
    gameScreen.classList.remove('active')

    screen.classList.add('active')
}

// ================= RESET GAME =================
async function resetGame(fullReset){

    board = Array(9).fill(null)

    gameOver = false

    // loser starts next
    if(lastWinner === 'X'){

        currentPlayer = 'O'

    } else {

        currentPlayer = 'X'
    }

    renderBoard()

    updateStatus()

    if(fullReset){

        xScore = 0
        oScore = 0
        drawScore = 0

        lastWinner = null

        updateScoreboard()
    }

    // AI starts automatically
    if(gameMode === 'ai' &&
       currentPlayer === 'O'){

        await aiMove()
    }
}

// ================= NAVIGATION =================
document.getElementById('play-btn').onclick = () => {

    showScreen(modeScreen)
}

document.getElementById('back-btn').onclick = () => {

    showScreen(homeScreen)
}

// ================= DIFFICULTY =================
document.querySelectorAll('.diff-btn').forEach(btn => {

    btn.onclick = () => {

        document
            .querySelectorAll('.diff-btn')
            .forEach(b => b.classList.remove('active'))

        btn.classList.add('active')

        difficulty = btn.dataset.level

        updateStatus()
    }
})

// ================= GAME MODES =================
document.getElementById('pvp-btn').onclick = async () => {

    gameMode = 'pvp'

    await resetGame(true)

    showScreen(gameScreen)
}

document.getElementById('ai-btn').onclick = async () => {

    gameMode = 'ai'

    await resetGame(true)

    showScreen(gameScreen)
}

// ================= RENDER BOARD =================
function renderBoard(){

    boardEl.innerHTML = ''

    board.forEach((cell, i) => {

        const div = document.createElement('div')

        div.className = 'cell'

        if(cell){

            div.classList.add(cell)
        }

        div.textContent = cell || ''

        div.onclick = () => handleMove(i)

        boardEl.appendChild(div)
    })
}

// ================= HANDLE MOVE =================
async function handleMove(i){

    if(board[i] || gameOver){

        return
    }

    if(gameMode === 'ai' &&
       currentPlayer === 'O'){

        return
    }

    playSound(clickSound)

    board[i] = currentPlayer

    renderBoard()

    if(await checkGame()){

        return
    }

    currentPlayer =
        currentPlayer === 'X'
        ? 'O'
        : 'X'

    updateStatus()

    // AI TURN
    if(gameMode === 'ai' &&
       currentPlayer === 'O'){

        await aiMove()
    }
}

// ================= AI MOVE =================
async function aiMove(){

    await new Promise(resolve =>
        setTimeout(resolve, 500)
    )

    const res = await fetch('/api/ai-move', {

        method:'POST',

        headers:{
            'Content-Type':'application/json'
        },

        body:JSON.stringify({
            board,
            difficulty
        })
    })

    const data = await res.json()

    if(data.index !== null &&
       data.index !== undefined){

        board[data.index] = 'O'
    }

    renderBoard()

    if(await checkGame()){

        return
    }

    currentPlayer = 'X'

    updateStatus()
}

// ================= PLAY SOUND =================
function playSound(sound){

    sound.currentTime = 0

    sound.play()
}

// ================= MATCH WINNER =================
function checkMatchWinner(){

    // PvP
    if(gameMode === 'pvp'){

        if(xScore >= WIN_TARGET){

            showWinnerPopup('🏆 Player X Wins the Match')

            xScore = 0
            oScore = 0
            drawScore = 0

            updateScoreboard()

            return true
        }

        if(oScore >= WIN_TARGET){

            showWinnerPopup('🏆 Player O Wins the Match')

            xScore = 0
            oScore = 0
            drawScore = 0

            updateScoreboard()

            return true
        }
    }

    // AI MODE
    else{

        if(xScore >= WIN_TARGET){

            showWinnerPopup('🏆 You Win the Match')

            xScore = 0
            oScore = 0
            drawScore = 0

            updateScoreboard()

            return true
        }

        if(oScore >= WIN_TARGET){

            showWinnerPopup('🤖 A.I Wins the Match')

            xScore = 0
            oScore = 0
            drawScore = 0

            updateScoreboard()

            return true
        }
    }

    return false
}

// ================= CHECK GAME =================
async function checkGame(){

    const res = await fetch('/api/check', {

        method:'POST',

        headers:{
            'Content-Type':'application/json'
        },

        body:JSON.stringify({ board })
    })

    const data = await res.json()

    if(data.result){

        gameOver = true

        // X WIN
        if(data.result === 'X'){

            xScore++

            lastWinner = 'X'

            statusEl.textContent =
                gameMode === 'ai'
                ? 'You Win!'
                : 'X Wins!'

            winSound.play()
        }

        // O WIN
        else if(data.result === 'O'){

            oScore++

            lastWinner = 'O'

            statusEl.textContent =
                gameMode === 'ai'
                ? 'A.I Wins!'
                : 'O Wins!'

           if(gameMode === 'pvp'){

        winSound.play()

    } else {

        loseSound.play()
    }
}

        // DRAW
        else{

            drawScore++

            statusEl.textContent = 'Draw!'

            lastWinner = null

            drawSound.play()
        }

        updateScoreboard()

        checkMatchWinner()

        setTimeout(async () => {

            await resetGame(false)

        }, 1500)

        return true
    }

    return false
}

// ================= STATUS =================
function updateStatus(){

    if(gameMode === 'pvp'){

        statusEl.textContent =
            `Player ${currentPlayer} Turn`
    }

    else{

        const modeName =
            difficulty.charAt(0).toUpperCase() +
            difficulty.slice(1)

        statusEl.textContent =
            `Play with A.I • ${modeName} Mode`
    }
}

// ================= SCOREBOARD =================
function updateScoreboard(){

    xScoreEl.textContent = xScore

    oScoreEl.textContent = oScore

    drawScoreEl.textContent = drawScore
}

// ================= OVERLAY =================
document.getElementById('pause-btn').onclick = () => {

    overlay.classList.add('active')
}

document.getElementById('resume-btn').onclick = () => {

    overlay.classList.remove('active')
}

document.getElementById('restart-btn').onclick = async () => {

    overlay.classList.remove('active')

    await resetGame(true)
}

document.getElementById('exit-btn').onclick = () => {

    overlay.classList.remove('active')

    showScreen(homeScreen)
}