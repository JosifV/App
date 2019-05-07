// http je urodjeni modul
const http = require("http");
const path = require("path");
const PORT = process.env.PORT || 3000;
const express = require("express");
const app = express();
// ispod definisanja constante app dodaj novu constantu server (ovako se pravi novi server) P.S tehnicki express radi isto to ispod haube
const server = http.createServer(app);
// uvezi socket.io i definisi njegovu instancu u koju se stavlja server.. zato smo i definisali novi server gore, jer neki server mora da se dodeli socketu
const socketIo = require("socket.io");
const io = socketIo(server);

const Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/users");

const publicDirPath = path.join(__dirname, "../public");
app.use(express.static(publicDirPath));

// io sada slusa evente, i u slucaju da se desi event connection (tj da se poveze), izvrsice ovu callback funkciju
// socket args sadrzi podatke o zapocetoj konekciji
io.on("connection", socket => {
  console.log("New socket connection");

  socket.on("join", ({ username, room }, callback) => {
    // socket.id sam napravi id - korisna stvar
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    // ukljuci se u tu i tu sobu
    socket.join(user.room);
    socket.emit("printMsg", generateMessage("Welcome"));

    // VAZNO .broadcast.emit() salje event svim klijentima osim onog ko ga salje, npm neko se ukljuci u chet, i stigne svima osim njemu poruka da se ulogovao, a .to() sluzi da se poruka posalje samo u toj sobi... npr ako bi bilo bez .to() poslao bi poruku svima u svim sobama
    socket.broadcast
      .to(user.room)
      .emit("printMsg", generateMessage(`${user.username} has joined.`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();

    // i da bi event acknowledgement radio moramo da podesimo i stranu koja prima event, a to znaci dodaj callback arg u funkciju koja sadrzi poslati payload...
    socket.on("newMessage", (message, callback) => {
      const filter = new Filter();
      if (filter.isProfane(message)) {
        return callback("Profanity detected, msg not sent");
      }
      io.to(user.room).emit(
        "printMsg",
        generateMessage(user.username, message)
      );
      //... i samo pozovi tu funkciju nakon sto se sav kod izvrsi, i prosledi joj args sa porukom koja ce stici klijentu kao potvrda
      callback("Delivered");
    });

    socket.on("sendLocation", (payload, callback) => {
      const coordinatesForClient =
        "https://google.com/maps?q=" +
        payload.latitude +
        "," +
        payload.longitude;
      io.to(user.room).emit(
        "locationMsg",
        generateLocationMessage(user.username, coordinatesForClient)
      );
      callback("Coordinates sent");
    });

    // da uradimo nesto kad se konekcija prekine koristimo socket.on('disconnect',()=>{})
    socket.on("disconnect", () => {
      if (user) {
        io.to(user.room).emit(
          "printMsg",
          generateMessage(`${user.username} has left the building`)
        );
        removeUser(user.id);
        io.to(user.room).emit("roomData", {
          room: user.room,
          users: getUsersInRoom(user.room)
        });
      }
    });
  });
});

// nije vise app.listen nego server.listen
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
