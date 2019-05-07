const socket = io();

const msgform = document.getElementById("msgform");
const inputId = document.getElementById("inputId");
const sendId = document.getElementById("sendId");
const locationBtn = document.querySelector("#sendLocation");
const messages = document.querySelector("#messages");
const messageTemp = document.querySelector("#messageTemp").innerHTML;
const locationTemp = document.querySelector("#locationTemp").innerHTML;
const infoTemp = document.querySelector("#infoTemp").innerHTML;
const sidebar = document.querySelector("#sidebar");

const autoScroll = () => {
  // get new mesage
  const newMessage = messages.lastElementChild;
  // height of new message
  const styleOfNM = getComputedStyle(newMessage);
  const marginOfNM = parseInt(styleOfNM.marginBottom);
  const heightOfNM = newMessage.offsetHeight + marginOfNM;

  // visible heigth
  const visHeight = messages.offsetHeight;

  // heigth of containing div
  const divHeigth = messages.scrollHeight;

  // how far we scroled?
  const scrollOffset = messages.scrollTop + visHeight;

  if (divHeigth - heightOfNM <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

msgform.addEventListener("submit", e => {
  e.preventDefault();
  sendId.setAttribute("disabled", "disabled"); // disable form
  const message = e.target.inputId.value;

  socket.emit("newMessage", message, conformation => {
    sendId.removeAttribute("disabled"); // enable form
    inputId.value = "";
    inputId.focus();

    console.log("The message " + conformation);
  });
});

socket.on("locationMsg", locationMessage => {
  const mapHtml = Mustache.render(locationTemp, {
    username: locationMessage.username,
    location: locationMessage.url,
    createdAt: moment(locationMessage.createdAt).format("h:mm a")
  });
  messages.insertAdjacentHTML("beforeend", mapHtml);
  autoScroll();
  console.log(locationMessage);
});

socket.on("printMsg", message => {
  const html = Mustache.render(messageTemp, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a")
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

document.querySelector("#sendLocation").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser.");
  }
  locationBtn.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition(
    position => {
      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
      socket.emit("sendLocation", payload, conformation => {
        console.log(conformation);
        locationBtn.removeAttribute("disabled");
      });
    },
    error => {
      console.log(error);
      locationBtn.removeAttribute("disabled");
    }
  );
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(infoTemp, {
    room,
    users
  });
  sidebar.innerHTML = html;
});
socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
