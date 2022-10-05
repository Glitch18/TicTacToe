const server = require('http').createServer();
const io = require('socket.io')(server);
const port = process.argv[2]

let players = {}
let ids = {}
let playerCount = 0;
let board = new Array(9).fill('.')
let symbols = {
    1: 'X',
    2: 'O'
}
let playerOneTurn = true

function addPlayer(socket, playerNumber) {
    players[playerNumber] = {
        id: socket.id,
        socket: socket
    }

    ids[socket.id] = playerNumber
}

function yourTurn(id) {
    player = ids[id];
    if(player === 1 && playerOneTurn) return true
    else if(player === 2 && !playerOneTurn) return true
    else return false
}

function isInvalidMove(move) {
    if(board[move] === '.') {
        return false
    } else {
        return true
    }
}

function updateBoard(pos, player) {
    board[pos] = symbols[player];
}

function checkVictory() {
    // Check horizontal
    for(i = 0; i < 7; i += 3) {
        if (board[i] === board[i+1] && board[i] === board[i+2] && board[i] !== '.') {
            return true;
        }
    }

    // Check vertical
    for(i = 0; i < 3; i++) {
        if(board[i] === board[i+3] && board[i] === board[i+6] && board[i] !== '.') {
            return true;
        }
    }

    // Check diagonal
    if(board[4] === board[0] && board[4] === board[8] && board[4] !== '.') {
        return true;
    }
    if(board[4] === board[2] && board[4] === board[6] && board[4] !== '.') {
        return true;
    }

    return false;
}

function checkTie() {
    for(i=0;i<9;i++) {
        if(board[i] === '.') return false
    }
    return true
}

function sendBoard(socket) {
    socket.emit("boardInfo", board);
}

io.on('connection', (socket) => {
    playerCount++;
    addPlayer(socket, playerCount)
    if(playerCount == 2) {
        players[1].socket.emit("startGame", "Game started. You are the first player")
        players[2].socket.emit("startGame", "Game started. You are the second player")
    }

    socket.on("move", (data) => {
        console.log(`move made by Player ${ids[socket.id]} of ${data}`)
        
        if(!yourTurn(socket.id)) {
            socket.emit('notYourTurn', 'Wait for you turn')
        } else if(isInvalidMove(data)) {
            socket.emit('invalidMove', "Invalid Move")
        } else {
            updateBoard(data, ids[socket.id])
            sendBoard(players[1].socket)
            sendBoard(players[2].socket)
            if(checkVictory()) {
                players[1].socket.emit('gameEnd', `Game won by ${playerOneTurn ? 'first' : 'second'} player`)
                players[2].socket.emit('gameEnd', `Game won by ${playerOneTurn ? 'first' : 'second'} player`)
            }
            if(checkTie()) {
                players[1].socket.emit('gameTie', `Game tied`)
                players[2].socket.emit('gameTie', `Game tied`)
            }
            playerOneTurn = !playerOneTurn
        }
    })

    socket.on('resign', () => {
        console.log(`RESIGN FROM PLAYER ${ids[socket.id]}`)
        const winner = 3 - parseInt(ids[socket.id])
        players[1].socket.emit('gameEnd', `Game won by player ${winner} due to resignation`)
        players[2].socket.emit('gameEnd', `Game won by player ${winner} due to resignation`)
    })

    socket.on('disconnect', () => {
        console.log(`DISCONNECT FROM PLAYER ${ids[socket.id]}`)
        const winner = 3 - parseInt(ids[socket.id])
        players[1].socket.emit('gameEnd', `Game won by player ${winner} since player ${3-winner} disconnected`)
        players[2].socket.emit('gameEnd', `Game won by player ${winner} since player ${3-winner} disconnected`)
        playerCount = 0;
    })
})

io.on('disconnect', (evt) => {
    console.log('disconnected')
})

server.listen(port, () => console.log(`server listening on port: ${port}`))