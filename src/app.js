let express = require("express");
let app = express();
let httpServer = require("http").createServer(app);
const { v4: uuidV4 } = require('uuid')
let io = require("socket.io")(httpServer);
var nouns = require('fun-word-list/lists/nouns');
console.log(nouns[0][0])
let PORT = process.env.PORT || 8080;


var wordToFind
var random


let connections = []
numUsers = 0;
let users = []
var room
var clients


app.set('view engine', 'ejs')
app.use(express.static("public"));


app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})


app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})


io.on("connect", (socket) => {




  // io.to(socket.id).emit('private', `you're secret code is `)

  socket.on('join', (room) => {
    socket.join(room);

  })

  connections.push(socket);


  console.log(`${socket.id} has connected`);




  socket.on("draw", (data) => {
    socket.to(data.ROOM_ID).emit("ondraw", { x: data.x, y: data.y })
  })
  socket.on("drawColor", (data)=>{
    socket.to(data.ROOM_ID).emit("ondrawColor", data.color)
  })

  socket.on('nname', function (data) {
    
    clients = io.sockets.adapter.rooms.get(data.ROOM_ID)
    var clientSocket
    for (const clientId of clients) {
    clientSocket  = io.sockets.sockets.get(clientId)
      
      newClient = {clientId:clientSocket.id, clientNickname:data.nickname, clientRoom:data.ROOM_ID}
      
      var index = users.findIndex(x => x.clientId== clientSocket.id)
      index === -1 ? users.push(newClient): console.log(users);
     
      }
    
    room = io.sockets.adapter.rooms.get(data.ROOM_ID).size;
      socket.username = data.nickname
    socket.emit('displayName', users)
    socket.to(data.ROOM_ID).emit('nname', data.nickname);
    firstPlayer = users.findIndex(x => x.clientRoom==data.ROOM_ID)

    playerReady = users.findIndex(x => x.clientId == clientSocket.id)


  if (room > 0 && playerReady > 0) {
    console.log('Hello')

    //Display for the first player
    io.to(users[firstPlayer].clientId).emit('showButton')

    //Display for the current player who is connecting
    //io.to(socket.id).emit('displayName', users)

  }
});

  // WHEN MORE THAN 2 PLAYERS ARE CONNECTED
  // AND PLAYER 1 HAVE CLICKED ON BUTTON 
  socket.on("beginParty", function (ROOM_ID) {
    
    wordArray = chooseAWord()
    indexes  = getAllIndexes(users, ROOM_ID)
    console.log(indexes.length)
       
    random = Math.floor(Math.random() * indexes.length-1);
    console.log(random)
    io.to(users[indexes[random]].clientId).emit('chooseAWord', wordArray)
  })

  function getAllIndexes(arr, val) {
    var indexes = [], i;
    for(i = 0; i < arr.length; i++)
        if (arr[i].clientRoom === val)
            indexes.push(i);
    return indexes;
}

  // WHEN THE PLAYER WHO DRAW HAVE CHOSEN A WORD
  socket.on("wordChoosen", (data) => {
    console.log(data.className)
    socket.emit("canDraw");
    wordToFind = data.className
    socket.to(data.ROOM_ID).emit('cantDraw', data.className.length);
    var counter = 10;
    var WinnerCountdown = setInterval(function(){
      io.to(data.ROOM_ID).emit('counter', counter);
      counter--
      if (counter === 0) {
        io.to(data.ROOM_ID).emit('endCounter', "Nobody found the word !");
        
        firstPlayer = users.findIndex(x => x.clientRoom==data.ROOM_ID)
        io.to(users[firstPlayer].clientId).emit('nextLevel')
        clearInterval(WinnerCountdown);
      }
    }, 1000);
  
  
  })

  // WHEN ONE PLAYER HAVE FOUND THE WORD
  socket.on("wordToFind", (data) => {
    if (data.message == wordToFind) {
      console.log('Yes !')
      firstPlayer = users.findIndex(x => x.clientRoom==data.ROOM_ID)
      io.to(data.ROOM_ID).emit("wordFound", data.message)
      io.to(users[firstPlayer].clientId).emit('nextLevel')
    }
  })


  // Function to choose 3 random words
  function chooseAWord() {
    var arr = new Array()
        while (arr.length < 3) {
      var r = Math.floor(Math.random() * 1000) + 1;
      wordToFind = nouns[r][1]
      if (arr.indexOf(wordToFind) === -1) arr.push(wordToFind);
    }
    console.log(arr)
    return arr
  }

  socket.on("down", (data) => {
    socket.to(data.ROOM_ID).emit('ondown', { x: data.x, y: data.y })
  })

  socket.on("disconnect", (reason) => {
    console.log(`${socket.id} is disconnected`);
    var userDisconnected = users.findIndex(x => x.clientId== socket.id)
    console.log(userDisconnected)

    if(!(userDisconnected === -1)){
      console.log(users[userDisconnected].clientId)
      io.emit('userDisconected', users[userDisconnected].clientNickname)
      users.splice(userDisconnected, 1)
      console.log(users)
      console.log('Suppression')
    }
   
    
   
    
    
  });


  // DISCUSS WITH PEOPLE
  socket.on('chat_message', (data) => {
    io.in(data.ROOM_ID).emit('chat_message', socket.username, data.message)
  })
});



// Lauch the server

httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));