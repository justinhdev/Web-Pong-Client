//const socket = io("http://localhost:3000");

var socket = io("https://pong-server-yj9i.onrender.com/");

const INITIAL_VELOCITY = 0.04;
const VELOCITY_INCREASE = 0.00001;
const SPEED = 0.01;
const BODYRECT = document.body.getBoundingClientRect();

class Ball {
  constructor(ballElem) {
    this.ballElem = ballElem;
    this.reset();
  }

  get x() {
    return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--x"));
  }

  set x(value) {
    this.ballElem.style.setProperty("--x", value);
  }

  get y() {
    return parseFloat(getComputedStyle(this.ballElem).getPropertyValue("--y"));
  }

  set y(value) {
    this.ballElem.style.setProperty("--y", value);
  }

  rect() {
    return this.ballElem.getBoundingClientRect();
  }

  reset() {
    socket.emit("getHeading");
    this.x = 50;
    this.y = 50;
    this.direction = { x: 0 };
    console.log(heading);
    this.direction = { x: Math.cos(heading), y: Math.sin(heading) };
    this.velocity = INITIAL_VELOCITY;
  }
  update(delta, paddleRects) {
    this.x += this.direction.x * this.velocity * delta;
    this.y += this.direction.y * this.velocity * delta;
    this.velocity += VELOCITY_INCREASE * delta;
    const rect = this.rect();
    if (timer == false) {
      if (rect.bottom >= BODYRECT.bottom || rect.top <= BODYRECT.top) {
        timer = true;
        this.direction.y *= -1;
        setTimeout(function () {
          timer = false;
        }, 250);
      }
    }

    if (timer2 == false) {
      if (paddleRects.some((r) => isCollision(r, rect))) {
        timer2 = true;
        socket.emit("hitAudio");
        hitAudio.load();
        this.direction.x *= -1;
        setTimeout(function () {
          timer2 = false;
        }, 250);
      }
    }
  }
}
let timer = false;
let timer2 = false;
class Paddle {
  constructor(paddleElem) {
    this.paddleElem = paddleElem;
    this.reset();
  }

  get position() {
    return parseFloat(
      getComputedStyle(this.paddleElem).getPropertyValue("--position")
    );
  }

  set position(value) {
    this.paddleElem.style.setProperty("--position", value);
  }

  rect() {
    return this.paddleElem.getBoundingClientRect();
  }

  reset() {
    this.position = 50;
  }

  update(delta, ballHeight) {
    this.position += SPEED * delta * (ballHeight - this.position);
  }
}

const ball = new Ball(document.getElementById("ball"));
const playerPaddle = new Paddle(document.getElementById("player-paddle"));
const computerPaddle = new Paddle(document.getElementById("computer-paddle"));
const playerScoreElem = document.getElementById("player-score");
const computerScoreElem = document.getElementById("computer-score");

const startAudio = new Audio();
const hitAudio = new Audio();
const missAudio = new Audio();
const gameOverAudio = new Audio();

startAudio.src = "start.wav";
hitAudio.src = "hit.wav";
missAudio.src = "miss.wav";
gameOverAudio.src = "gameover.wav";

var startSingle = false;
var startMulti = false;
var delta;
var playernum;
var heading;

socket.on("getIndex", (index) => {
  playernum = index[0];
});
socket.on("getHeading-send", (head) => {
  heading = head;
});
socket.on("startGame-recieve", () => {
  startSingle = false;
  multiStartGame();
});
socket.on("mousePosition-recieve1", (mousePos) => {
  playerPaddle.position = mousePos;
});
socket.on("mousePosition-recieve2", (mousePos) => {
  if (startSingle != true) {
    computerPaddle.position = mousePos;
  } else {
    playerPaddle.position = mousePos;
  }
});
socket.on("hitAudio-send", () => {
  console.log("hit");
  hitAudio.play();
});
socket.on("missAudio-send", () => {
  missAudio.play();
});
socket.on("ready-recieve", () => {
  btnrdy.style.display = "none";
  document.getElementById("btnrdy").innerHTML = "ready?";
  startMulti = true;
  ball.reset();
});
socket.on("ready-waiting", () => {
  document.getElementById("btnrdy").innerHTML = "waiting on one!";
});
socket.on("roundOver-recieve", (pscore, cscore) => {
  playerScoreElem.textContent = pscore;
  computerScoreElem.textContent = cscore;
  startMulti = false;
  btnrdy.style.display = "block";
  ball.reset();
});

btn.addEventListener("click", () => {
  singleStartGame();
});
btnmulti.addEventListener("click", () => {
  socket.emit("startGame-send");
});
btnrdy.addEventListener("click", () => {
  socket.emit("ready-send");
});

document.body.addEventListener("mousemove", (e) => {
  var mousePos = (e.y / BODYRECT.height) * 100;
  if (startSingle == true) {
    playerPaddle.position = mousePos;
  } else {
    if (playernum == socket.id) {
      socket.emit("mousePosition-send1", mousePos);
    } else {
      socket.emit("mousePosition-send2", mousePos);
    }
  }
});

document.body.addEventListener("touchmove", (e) => {
  var mousePos = (e.touches[0].clientY / BODYRECT.height) * 100;
  if (startSingle == true) {
    playerPaddle.position = mousePos;
  } else {
    if (playernum == socket.id) {
      socket.emit("mousePosition-send1", mousePos);
    } else {
      socket.emit("mousePosition-send2", mousePos);
    }
  }
});


function singleStartGame() {
  ball.reset();
  btn.style.display = "none";
  btnmulti.style.display = "none";
  startSingle = true;
  playerScoreElem.textContent = 0;
  computerScoreElem.textContent = 0;
  startAudio.play();
}
function multiStartGame() {
  ball.reset();
  btn.style.display = "none";
  btnmulti.style.display = "none";
  startMulti = true;
  playerScoreElem.textContent = 0;
  computerScoreElem.textContent = 0;
  startAudio.play();
}

var rect1 = playerPaddle.rect();
var rect2 = computerPaddle.rect();
let lastTime;
const fps = 100;
function update(time) {
  requestAnimationFrame(update);
  if (startSingle || startMulti == true) {
    if (lastTime != null) {
      delta = time - lastTime;
    }
    rect1 = playerPaddle.rect();
    rect2 = computerPaddle.rect();
    ball.update(delta, [rect1, rect2]);
    if (startSingle == true) {
      computerPaddle.update(delta, ball.y);
    }
    if (isLose()) {
      handleLose();
    }
  }
  lastTime = time;
}

function isLose() {
  const rect = ball.rect();
  return rect.right >= BODYRECT.right || rect.left <= BODYRECT.left;
}




function handleLose() {
  const rect = ball.rect();
  if (rect.right >= BODYRECT.right) {
    playerScoreElem.textContent = parseInt(playerScoreElem.textContent) + 1;
  } else {
    computerScoreElem.textContent = parseInt(computerScoreElem.textContent) + 1;
  }
  socket.emit("missAudio");
  ball.reset();
  if (startSingle) {
    if (
      playerScoreElem.textContent == 3 ||
      computerScoreElem.textContent == 3
    ) {
      btn.style.display = "block";
      btnmulti.style.display = "block";
      startSingle = false;
      startMulti = false;
      gameOverAudio.play();
      
    }
  } else {
    if (
      playerScoreElem.textContent == 3 ||
      computerScoreElem.textContent == 3
    ) {
      btn.style.display = "block";
      btnmulti.style.display = "block";
      startSingle = false;
      startMulti = false;
      gameOverAudio.play();
      btnrdy.style.display = "none";
    } else {
      socket.emit("roundOver-send", playerScoreElem.textContent, computerScoreElem.textContent)
    }
  }
}

function randomNumberBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function isCollision(rect1, rect2) {
  return (
    rect1.x <= rect2.x + rect2.width &&
    rect1.x + rect1.width >= rect2.x &&
    rect1.y <= rect2.y + rect2.height &&
    rect1.height + rect1.y >= rect2.y
  );
}

update();
