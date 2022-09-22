//const socket = io("http://localhost:3000");

var socket = io('https://web-pong.herokuapp.com/');


const INITIAL_VELOCITY = 0.025;
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
    var heading;
    socket.emit("getHeading");
    socket.on("getHeading-send", (head) => {
      heading = head;
      this.x = 50;
      this.y = 50;
      this.direction = { x: 0 };
      this.direction = { x: Math.cos(heading), y: Math.sin(heading) };
      this.velocity = INITIAL_VELOCITY;
    });
  }
  update(delta, paddleRects) {
    this.x += this.direction.x * this.velocity * delta;
    this.y += this.direction.y * this.velocity * delta;
    this.velocity += VELOCITY_INCREASE * delta;
    const rect = this.rect();
    if (rect.bottom >= BODYRECT.bottom || rect.top <= BODYRECT.top) {
      this.direction.y *= -1;
    }
    if (paddleRects.some((r) => isCollision(r, rect))) {
      this.direction.x *= -1;
      collisionTimeLag();
    }
  }
}

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

var start = false;
var newRect;
var delta;
var playernum;
var index = 0;

socket.on("getIndex", (index) => {
  playernum = index[0];
});
socket.on("startGame-recieve", () => {
  socket.emit("getHeading");
  startGame();
});
socket.on("mousePosition-recieve1", (mousePos) => {
  playerPaddle.position = mousePos;
});
socket.on("mousePosition-recieve2", (mousePos) => {
  computerPaddle.position = mousePos;
});
socket.on("ballUpdate-recieve", (rect) => {
  newRect = rect;
});

socket.on("delta-recieve", (deltaSend) => {
  delta = deltaSend;
});
socket.on("gameOver-recieve", () => {
  handleLose();
});

btn.addEventListener("click", () => {
  socket.emit("startGame-send");
});

document.body.addEventListener("mousemove", (e) => {
  var mousePos = (e.y / BODYRECT.height) * 100;
  if (playernum == socket.id) {
    socket.emit("mousePosition-send1", mousePos);
  } else {
    socket.emit("mousePosition-send2", mousePos);
  }
});

function startGame() {
  btn.style.display = "none";
  btnmulti.style.display = "none";
  start = true;
  ball.reset();
  playerScoreElem.textContent = 0;
  computerScoreElem.textContent = 0;
}

let lastTime;
function update(time) {
  requestAnimationFrame(update);
  if (lastTime != null) {
    if (playernum == socket.id) {
      const deltaSend = time - lastTime;
      socket.emit("delta-send", deltaSend);
    }
    var rect1 = playerPaddle.rect();
    var rect2 = computerPaddle.rect();
    if (playernum == socket.id) {
      rect1 = playerPaddle.rect();
    } else {
      rect2 = computerPaddle.rect();
    }
    if (start == true) {
      socket.emit("ballUpdate-send", [rect1, rect2]);
      ball.update(delta, newRect);
    }
    if (isLose()) {
      socket.emit("gameOver-send");
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

  ball.reset();
  if (playerScoreElem.textContent == 2 || computerScoreElem.textContent == 2) {
    btn.style.display = "block";
    start = false;
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

function collisionTimeLag() {
  var activated = false;
  setTimeout(() => {
    activated = true;
  }, 1000);
}
update();
