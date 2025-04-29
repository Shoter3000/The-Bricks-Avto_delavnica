var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Žogica
var ballRadius = 10;
var x, y, dx, dy;
var ballSpeed = 4;

// Ploščica
var paddleHeight = 10;
var paddleWidth = 100;
var paddleX;

// Opeke
var brickWidth = 50;
var brickPadding = 20;
var brickOffsetTop = 40;

var brickRowCount;
var brickColumnCount;
var totalBricksWidth;
var brickOffsetLeft;
var bricks = [];

// Nivoji
var currentLevel = 0;
var levels = [
  { rows: 3, cols: 11, pattern: "full" },
  { rows: 4, cols: 9, pattern: "checker" },
  { rows: 5, cols: 7, pattern: "random" }
];

// Rezultati
var score = 0;
var highScore = localStorage.getItem("highScore") || 0;
document.getElementById("highScore").innerText = highScore;

// Čas
var levelStartTime;
var levelElapsedTime = 0;

// Točkovni efekti
var scorePopups = [];


function updateTimerDisplay() {
  const seconds = Math.floor(levelElapsedTime / 1000);
  document.getElementById("time").innerText = seconds + " s";

}

const appleImages = [
  "Images/spring.png",
  "Images/car-parts.png",
  "Images/piston.png"
];

function initGame() {
  x = canvas.width / 2;
  y = canvas.height - 40;
  dx = ballSpeed * (Math.random() < 0.5 ? -1 : 1);
  dy = -ballSpeed;
  paddleX = (canvas.width - paddleWidth) / 2;
  scorePopups = [];
}

function loadLevel(levelIndex) {
  var level = levels[levelIndex];
  brickRowCount = level.rows;
  brickColumnCount = level.cols;

  totalBricksWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
  brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;

  bricks = [];
  for (var c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (var r = 0; r < brickRowCount; r++) {
      var status = 1;
      if (level.pattern === "checker" && (r + c) % 2 === 0) status = 0;
      if (level.pattern === "random" && Math.random() < 0.4) status = 0;

      bricks[c][r] = {
        x: 0,
        y: 0,
        status: status,
        icon: new Image()
      };
      bricks[c][r].icon.src = appleImages[r % appleImages.length];
    }
  }
}

initGame();
loadLevel(currentLevel);

var ballIcon = new Image();
ballIcon.src = "Images/tools.png";

function getBrickPoints(imageSrc) {
  if (imageSrc.includes("spring")) return 3;
  if (imageSrc.includes("car-parts")) return 2;
  if (imageSrc.includes("piston")) return 1;
  return 1;
}

function drawBricks() {
  var adjustedHeight = brickWidth / 1.05;
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        var brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        var brickY = r * (adjustedHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        ctx.save();
        ctx.translate(brickX + brickWidth / 2, brickY + adjustedHeight / 2);
        ctx.scale(
          1 + 0.03 * Math.sin(Date.now() / 250),
          1 + 0.03 * Math.sin(Date.now() / 250)
        );
        ctx.drawImage(
          bricks[c][r].icon,
          -brickWidth / 2,
          -adjustedHeight / 2,
          brickWidth,
          adjustedHeight
        );
        ctx.restore();
      }
    }
  }
}

function drawScorePopups() {
  const now = Date.now();
  scorePopups = scorePopups.filter(p => now - p.time < 600);

  for (const popup of scorePopups) {
    const elapsed = now - popup.time;
    const opacity = 1 - elapsed / 600;
    const yOffset = -elapsed / 15;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = "gold";
    ctx.font = "bold 16px Arial";
    ctx.fillText("+" + popup.points, popup.x, popup.y + yOffset);
    ctx.restore();
  }
}

function drawBall() {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((Date.now() / 100) % (2 * Math.PI));
  ctx.drawImage(ballIcon, -ballRadius, -ballRadius, ballRadius * 2, ballRadius * 2);
  ctx.restore();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();
}

function drawScore() {
  document.getElementById("score").innerText = score;
}

function collisionDetection() {
  var adjustedHeight = brickWidth / 1.05;
  for (var c = 0; c < brickColumnCount; c++) {
    for (var r = 0; r < brickRowCount; r++) {
      var b = bricks[c][r];
      if (b.status === 1) {
        if (
          x > b.x &&
          x < b.x + brickWidth &&
          y > b.y &&
          y < b.y + adjustedHeight
        ) {
          dy = -dy;
          b.status = 0;

          const points = getBrickPoints(b.icon.src);
          score += points;
          drawScore();

          // dodaj vizualno povratno informacijo
          scorePopups.push({
            x: b.x + brickWidth / 2,
            y: b.y,
            points: points,
            time: Date.now()
          });

          checkWin();
        }
      }
    }
  }
}

function checkWin() {
  let allCleared = true;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        allCleared = false;
        break;
      }
    }
  }

  if (allCleared) {
    clearInterval(gameInterval);
    gameRunning = false;


    if (currentLevel < levels.length - 1) {
      currentLevel++;
      Swal.fire({
        icon: 'success',
        title: 'Odlično!',
        text: 'Naslednji nivo!',
        confirmButtonText: 'Naprej!',
        heightAuto: false,
        customClass: {
          confirmButton: 'swal-button',
      }
      }).then(() => {
        resetGame(false);
        startGame();
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Zmagal si! 🏆',
        text: 'Premagal si vse nivoje!',
        confirmButtonText: 'Nova igra',
        heightAuto: false,
        customClass: {
          confirmButton: 'swal-button',
      }
      }).then(() => {
        currentLevel = 0;
        resetGame(true);
        startGame();
      });
    }
  }
}

function draw() {
  levelElapsedTime = Date.now() - levelStartTime;
  updateTimerDisplay();

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawScorePopups(); // prikaz točk
  drawBall();
  drawPaddle();
  collisionDetection();

  if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
  if (y + dy < ballRadius) dy = -dy;

  else if (y + dy > canvas.height - paddleHeight - ballRadius) {
    if (x > paddleX && x < paddleX + paddleWidth) {
      let hitPoint = (x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
      let angle = hitPoint * (Math.PI / 3);
      dx = ballSpeed * Math.sin(angle);
      dy = -ballSpeed * Math.cos(angle);
    } else {
      gameOver();
    }
  }

  x += dx;
  y += dy;

  if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 7;
  else if (leftPressed && paddleX > 0) paddleX -= 7;
}

function gameOver() {
  clearInterval(gameInterval);
  gameRunning = false;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
    document.getElementById("highScore").innerText = highScore;
  }

  Swal.fire({
    icon: 'error',
    title: 'Konec igre!',
    text: 'Izgubil si! Poskusi znova',
    confirmButtonText: 'OK',
    heightAuto: false,
    customClass: {
      confirmButton: 'swal-button',
  }
  });
}

var gameInterval;
var gameRunning = false;
var gamePaused = false;
var rightPressed = false;
var leftPressed = false;

function togglePause() {
  if (gameRunning) {
    const pauseBtn = document.getElementById("pauseBtn");
    const pauseBtnImg = pauseBtn.querySelector("img");
    
    if (gamePaused) {
      gameInterval = setInterval(draw, 10);
      gamePaused = false;
      if (pauseBtnImg) pauseBtnImg.src = "Images/pause.png";
    } else {
      clearInterval(gameInterval);
      gamePaused = true;
      if (pauseBtnImg) pauseBtnImg.src = "Images/play.png";
    }
  }
}


document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "ArrowLeft") leftPressed = true;
  else if (e.key === "Escape") togglePause();
});

document.addEventListener("keyup", function (e) {
  if (e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "ArrowLeft") leftPressed = false;
});

function resetGame(resetScore = true) {
  clearInterval(gameInterval);
  gameRunning = false;
  gamePaused = false;
  if (resetScore) score = 0;
  drawScore();
  initGame();
  loadLevel(currentLevel);
  levelElapsedTime = 0;
  updateTimerDisplay();
}

function updateDifficulty() {
  var select = document.getElementById("difficultySelect");
  var value = parseInt(select.value);
  ballSpeed = value + 1;
  dx = ballSpeed;
  dy = -ballSpeed;
}

function startGame() {
  document.getElementById("canvas").focus();
  if (!gameRunning) {
    gameRunning = true;
    updateDifficulty();
    levelStartTime = Date.now();
    levelElapsedTime = 0;
    updateTimerDisplay();
    gameInterval = setInterval(draw, 10);
  }
}

function resetHighScore() {
  highScore = 0;
  localStorage.setItem("highScore", highScore);
  document.getElementById("highScore").innerText = highScore;
}

window.onload = () => {
  resetHighScore();
  document.getElementById("startBtn").addEventListener("click", () => {
    resetGame(true);
    startGame();
    resetHighScore();
  });

  document.getElementById("pauseBtn").addEventListener("click", togglePause);

  document.getElementById("resetBtn").addEventListener("click", () => {
    resetGame(true);
    startGame();
  });

  document.getElementById("difficultySelect").addEventListener("change", updateDifficulty);
};


//sweetalert
document.getElementById('canvas').addEventListener('click', function() {
  Swal.fire({
    title: 'Razvijalec',
    text: 'Nejc Vidmar',
    icon: 'info',
    iconColor: 'rgb(108, 108, 108)',
    confirmButtonText: 'Zapri',
    heightAuto: false,
    customClass: {
      confirmButton: 'swal-button',
      icon: 'custom-icon'
    }
  });
});