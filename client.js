const readcommand = require('readcommand')

let url = process.argv[2]
let port = process.argv[3]
let serverUrl = 'http://' + url + ':' + port
let sigints = 0

// TODO: waiting for turn

let socket = require('socket.io-client')(serverUrl);

socket.on('connect', () => {
    console.log('connected: ' + socket.id)
})

socket.on('startGame', (data) => {
    console.log(data)
    readcommand.loop(function(err, args, str, next) {
        if (err && err.code !== 'SIGINT') {
            throw err;
        } else if (err) {
            if (sigints === 1) {
                process.exit(0);
            } else {
                sigints++;
                console.log('Press ^C again to exit.');
                return next();
            }
        } else if (args[0] === 'r') {
            socket.emit('resign', 'resign')
        } else if (isNaN(args[0])) {
            console.log("Invalid Move")
        } else if (parseInt(args[0]) > 9 || parseInt(args[0]) < 1) {
            console.log("Invalid Move")
        } else {
            socket.emit("move", parseInt(args[0]) - 1)
        }
    
        return next();
    });
})

socket.on('invalidMove', function() {
    console.log('Invalid Move')
});

socket.on('notYourTurn', function(data) {
    console.log(data)
});

socket.on('boardInfo', (board) => {
    console.log(board.slice(0,3))
    console.log(board.slice(3,6))
    console.log(board.slice(6,9))
})

socket.on('gameEnd', (data) => {
    console.log(data)
    process.exit(0);
})

socket.on('gameTie', (data) => {
    console.log(data)
    process.exit(0);
})

socket.on('disconnect', function() {
    console.log('disconnected')
});
