var socket = io()
let canvas = document.getElementById('canvas')
canvas.style.width = '100%';
canvas.style.height = '100%';

canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
var BB = canvas.getBoundingClientRect();
var offsetX = BB.left;
var offsetY = BB.top;
var nickname = document.getElementById('nickname'),
    btn = document.getElementById('submitnickname');
beginPartyBtn = document.getElementById('beginParty')
popup = document.getElementById('popUp')
var canDraw = false
let ctx = canvas.getContext("2d")
let x, y
let mouseDown = false
let draw_color = "black"



socket.emit('join', ROOM_ID);



window.onmousedown = (e) => {
    ctx.moveTo(x, y)
    socket.emit('down', { x, y, ROOM_ID })
    mouseDown = true
}


$("form").submit(function (e) {
    e.preventDefault()
    socket.emit("chat_message", { message: $('#msg').val(), ROOM_ID })
    socket.emit("wordToFind", { message: $('#msg').val(), ROOM_ID })
    $("#msg").val('')

    return false
})


socket.on('wordFound', (data) => {
    canDraw = false
    $('#motFound').css('visibility', 'visible')
    $("#motFound").append($("<p>").text(`Le mot à trouver était ${data}`))
})

socket.on('nextLevel', () => {
    $('button#nextLevel').css('visibility', 'visible')
})

$('button#nextLevel').on('click', function () {
    socket.emit('beginParty', ROOM_ID)
    $('#motFound').css('visibility', 'hidden')
})

socket.on('counter', function(count){
    $('#counter').html(count);
  });

let created = $('<button id="choosingWord"></button>')

socket.on('chooseAWord', function (arr) {
    $("#popUp").remove("#choosingWord");
    $("#motFound").css('visibility', 'hidden')

    popup.style.visibility = "visible"
    console.log(arr)
    arr.forEach(element => {
        console.log(element[0])
        created.attr('id', element)
        $("#listOfWord").append($("<button id='choosingWord' class='" + element + "'></button>").text(element))
    })

})



socket.on('chat_message', function (username, msg) {
    $("#messages").append($("<p>").text(`${username} : ${msg}`))
})

socket.on('displayName', function (data) {
    console.log(data)

    data.forEach(element => {
        if (element.clientRoom == ROOM_ID) {
            $('#listPlayers').append($("<p id='" + element.clientNickname + "'>").text(`${element.clientNickname}`))
        }
    });
})

socket.on('nname', function (data) {
    $("#" + data + "").remove()
    $('#listPlayers').append($("<p id='" + data + "'>").text(`${data}`))
})

socket.on('userDisconected', function (user) {
    console.log(user)
    element = document.getElementById(user)
    if (element){
        element.remove()
    }
})

socket.on('showButton', function () {
    $('#beginDiv').css('visibility', 'visible')
})

socket.on('notShowButton', () => {
    $('#beginDiv').css('visibility', 'visible')
})



btn.addEventListener('click', function () {
    if (nickname.value == "") {
        return console.log('Le pseudo doit contenir des caracteres bitch')
    }
    socket.emit('nname', ({ nickname: nickname.value, ROOM_ID }));
    $('#entrePseudonyme').css('visibility', 'hidden')
    $('#drawing').css('visibility', 'visible')

})

$('#popUp').on('click', 'button', function () {
    console.log(this.className)
    socket.emit('wordChoosen', ({ className: this.className, ROOM_ID }))
    $('#popUp').css('visibility', 'hidden')
});





beginPartyBtn.addEventListener('click', function () {
    console.log('Allez on joue ! ')
    $('#beginDiv').css('visibility', 'hidden')
    socket.emit('beginParty', ROOM_ID)
});


window.onmouseup = (e) => {
    mouseDown = false
}

socket.on("ondraw", ({ x, y }) => {
    ctx.lineTo(x, y)
    ctx.stroke()
   
})

socket.on("cantDraw", (wordLength) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    canDraw = false

    for (i = 0; i < wordLength; i++) {
        $('#wordToFindIndice').append('_ ')
    }
})

socket.on("canDraw", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    canDraw = true
})

socket.on("endCounter", ()=>{
    canDraw = false
    $('#popUp').css('visibility', 'visible')
    $('#popUp').append($('<p>').text(count))
    
})

socket.on('ondown', ({ x, y }) => {
    ctx.moveTo(x, y)
})

socket.on('ondrawColor', (color)=>{
    draw_color = color
})


$('.color').on('click', (event)=>{
    
    draw_color = event.target.id
    socket.emit('drawColor', { color:event.target.id, ROOM_ID })

})

window.onmousemove = (e) => {
    x = parseInt(e.clientX - offsetX)
    y = parseInt(e.clientY - offsetY)

    if (mouseDown && canDraw) {
        socket.emit('draw', { x, y, ROOM_ID })
        ctx.lineTo(x, y)
        ctx.strokeStyle = draw_color
        ctx.stroke()
    }
}


