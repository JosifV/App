const users = [];

const addUser = ({ id, username, room }) => {
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if (!username || !room) {
    return {
      error: "Username and room are required"
    };
  }

  const existingUser = users.find(user => {
    return user.room === room && user.username === username;
  });

  if (existingUser) {
    return {
      error: "User already exist"
    };
  }
  const user = { id, username, room };
  users.push(user);
  return { user };
};

const removeUser = id => {
  const index = users.findIndex(user => {
    return user.id === id;
  });
  // ako index nije jednak -1 znaci da smo pronasli nekog usera sa gore pomenutim id-om
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

const getUser = id => {
  return (index = users.findIndex(user => {
    return user.id === id;
  }));
};

const getUsersInRoom = room => {
  return (usersInRoom = users.filter(user => {
    return user.room === room;
  }));
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};
