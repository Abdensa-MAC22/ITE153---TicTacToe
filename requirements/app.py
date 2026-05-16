from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# =========================================================
# HOME
# =========================================================

@app.route('/')
def index():
    return render_template('index.html')


# =========================================================
# CHECK GAME
# =========================================================

@app.route('/api/check', methods=['POST'])
def check():

    data = request.get_json()

    board = data.get('board')

    result, win_line = check_winner(board)

    return jsonify({
        'result': result,
        'winLine': win_line
    })


# =========================================================
# AI MOVE
# =========================================================

@app.route('/api/ai-move', methods=['POST'])
def ai_move():

    data = request.get_json()

    board = data.get('board')

    difficulty = data.get('difficulty')

    move = get_ai_move(board, difficulty)

    if move is not None:
        board[move] = 'O'

    result, win_line = check_winner(board)

    return jsonify({
        'index': move,
        'result': result,
        'winLine': win_line
    })


# =========================================================
# WIN CHECKER
# =========================================================

WIN_LINES = [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [0,4,8],
    [2,4,6]
]


def check_winner(board):

    for line in WIN_LINES:

        a, b, c = line

        if board[a] and board[a] == board[b] == board[c]:
            return board[a], line

    if all(cell is not None for cell in board):
        return 'draw', []

    return None, []


# =========================================================
# MINIMAX
# =========================================================

def minimax(board, is_max, alpha, beta):

    result, _ = check_winner(board)

    if result == 'O':
        return 1

    if result == 'X':
        return -1

    if result == 'draw':
        return 0

    empty = [i for i, v in enumerate(board) if v is None]

    if is_max:

        best = -999

        for i in empty:

            board[i] = 'O'

            score = minimax(board, False, alpha, beta)

            board[i] = None

            best = max(best, score)

            alpha = max(alpha, best)

            if beta <= alpha:
                break

        return best

    else:

        best = 999

        for i in empty:

            board[i] = 'X'

            score = minimax(board, True, alpha, beta)

            board[i] = None

            best = min(best, score)

            beta = min(beta, best)

            if beta <= alpha:
                break

        return best


# =========================================================
# BEST MOVE
# =========================================================

def best_move(board):

    best_score = -999

    move = None

    for i in range(9):

        if board[i] is None:

            board[i] = 'O'

            score = minimax(
                board,
                False,
                -999,
                999
            )

            board[i] = None

            if score > best_score:

                best_score = score

                move = i

    return move


# =========================================================
# EASY AI
# =========================================================

def easy_ai(board):

    empty = [i for i, v in enumerate(board) if v is None]

    return random.choice(empty)


# =========================================================
# AI DIFFICULTY
# =========================================================

def get_ai_move(board, difficulty):

    board = [x if x else None for x in board]

    if difficulty == 'easy':

        return easy_ai(board)

    elif difficulty == 'medium':

        return best_move(board) if random.random() > 0.5 else easy_ai(board)

    else:

        return best_move(board)


# =========================================================
# RUN
# =========================================================

if __name__ == '__main__':
    app.run(debug=True)