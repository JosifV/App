const http = require("http");
const path = require("path");
const PORT = process.env.PORT || 3000;
const express = require("express");
const app = express();
const server = http.createServer(app);
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

const publicDirPath = path.join(__dirname, "./public");
app.use(express.static(publicDirPath));

io.on("connection", socket => {
  console.log("New socket connection");

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit("printMsg", generateMessage("Welcome"));

    socket.broadcast
      .to(user.room)
      .emit("printMsg", generateMessage(`${user.username} has joined.`));
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();

    socket.on("newMessage", (message, callback) => {
      const filter = new Filter();
      if (filter.isProfane(message)) {
        return callback("Profanity detected, msg not sent");
      }
      io.to(user.room).emit(
        "printMsg",
        generateMessage(user.username, message)
      );
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

server.listen(PORT, () => {
  console.log("Server running on port " + PORT + " - Status: All fineee");
});
