const express = require('express');
const app = express();
const indexRouter = require('./routes/index');   
const path = require('path');

const http = require('http');
const socketIO = require('socket.io');
const server = http.createServer(app);
const io = socketIO(server);

let waitingusers = [];
let rooms = {};

io.on("connection",function(socket){
    //console.log("connected from the web browser");
    // console.log(socket.id)
    socket.on("joinroom",function(){
        // console.log("request to join room");
        if(waitingusers.length > 0){
            let partner = waitingusers.shift();
            const roomname = `${socket.id}-${partner.id}`;
            socket.join(roomname);
            partner.join(roomname);

            io.to(roomname).emit("joined",roomname);
        }
        else{
            waitingusers.push(socket);
        }
    });
   
   socket.on("signalingMessage",function(data){
      socket.broadcast.to(data.room).emit("signalingMessage",data.message);
   });

   socket.on("message",function(data){
    // console.log(data);
    socket.broadcast.to(data.room).emit("message",data.message);
   });

   socket.on("disconnect",function(){
    let index = waitingusers.findIndex(
        (waitingusers) => waitingusers.id === socket.io
    );
    waitingusers.splice(index,1);
   });

});

app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));

app.use("/",indexRouter);

server.listen(3000);