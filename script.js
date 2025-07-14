const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");
const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");

const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

let player = { x: 50, y: 180, w: 50, h: 50, color: "yellow" };
let keys = {};
let items = [];
let fires = [];
let score = 0;
let lives = 3;
let collected = 0;
let playing = false;
// Variabili movimento
let moveLeft = false, 
moveRight = false, 
moveUp = false, 
moveDown = false;

let gameTimer = 30; // seconds
let timerInterval;

const bonusEmojis = ["🍕", "🎧", "🍸"];
const fireEmoji = "🔥";

let soundEnabled = true;

const logoImg = new Image();
logoImg.src = "asset/image/logo.png";

// Eventi Touch
const addTouchControl = (id, directionVar) => {
  const btn = document.getElementById(id);
  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    window[directionVar] = true;
  });
  btn.addEventListener("touchend", e => {
    e.preventDefault();
    window[directionVar] = false;
  });
};



// --- Suoni ---
function playSound(freqStart, freqEnd, duration = 0.3) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freqStart, now);
    gain.gain.setValueAtTime(0.3, now);

    osc.start(now);
    osc.frequency.linearRampToValueAtTime(freqEnd, now + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.stop(now + duration);

    osc.onended = () => audioCtx.close();
  } catch (e) {}
}

function playPlaySound() {
  if (!soundEnabled) return;
  playSound(300, 600, 0.2);
}

function playBonusSound() {
  if (!soundEnabled) return;
  playSound(600, 900, 0.15);
}

function playFireHitSound() {
  if (!soundEnabled) return;
  playSound(150, 100, 0.5);
}

function playWinSound() {
  if (!soundEnabled) return;
  // semplice melodia vittoria
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    const notes = [660, 880, 990];
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.3, now);

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + i * 0.25);
      osc.connect(gain);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.2);
    });

    setTimeout(() => audioCtx.close(), notes.length * 300);
  } catch (e) {}
}

function playLoseGameSound() {
  if (!soundEnabled) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    gain.gain.setValueAtTime(0.3, now);

    osc.start(now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1);

    osc.stop(now + 1);

    osc.onended = () => {
      audioCtx.close();
    };
  } catch (e) {}
}

// --- Funzioni gioco ---
function startGame() {
  playPlaySound();

  startScreen.style.display = "none";
  winScreen.style.display = "none";

  playing = true;
  score = 0;
  lives = 3;
  collected = 0;
  player.x = 50;
  player.y = 180;
  items = [];
  fires = [];

  for (let i = 0; i < 7; i++) spawnItem();
  for (let i = 0; i < 7; i++) spawnFire();

  gameTimer = 30;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    gameTimer--;
    if (gameTimer <= 0) {
      clearInterval(timerInterval);
      playing = false;
      playLoseGameSound();
      alert("Tempo scaduto! Hai perso!");
      location.reload();
    }
  }, 1000);

  requestAnimationFrame(update);
}

function spawnItem() {
  items.push({
    x: 800 + Math.random() * 300,
    y: Math.random() * (canvas.height - 24),
    emoji: bonusEmojis[Math.floor(Math.random() * bonusEmojis.length)],
    speed: 2.5
  });
}

function spawnFire() {
  fires.push({
    x: 800 + Math.random() * 300,
    y: Math.random() * (canvas.height - 24),
    emoji: fireEmoji,
    speed: 2.5
  });
}

function update() {
  if (!playing) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Player movement
  if (keys["ArrowUp"] && player.y > 0) player.y -= 3;
  if (keys["ArrowDown"] && player.y + player.h < canvas.height) player.y += 3;
  if (keys["ArrowLeft"] && player.x > 0) player.x -= 3;
  if (keys["ArrowRight"] && player.x + player.w < canvas.width) player.x += 3;
  if (moveLeft && player.x > 0) player.x -= 5;
  if (moveRight && player.x < canvas.width - player.width) player.x += 5;


  // Draw player
  if (logoImg.complete) {
  ctx.drawImage(logoImg, player.x, player.y, player.w, player.h);
} else {
  logoImg.onload = () => {
    ctx.drawImage(logoImg, player.x, player.y, player.w, player.h);
  };
}

  // Draw & update items
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    ctx.font = "28px serif";
    ctx.fillText(item.emoji, item.x, item.y + 24);
    item.x -= item.speed;

    if (checkCollision(player, item)) {
      score += 10;
      collected++;
      playBonusSound();
      items.splice(i, 1);
      spawnItem();
    } else if (item.x < -30) {
      items.splice(i, 1);
      spawnItem();
    }
  }

  // Draw & update fires
  for (let i = fires.length - 1; i >= 0; i--) {
    const fire = fires[i];
    ctx.font = "28px serif";
    ctx.fillText(fire.emoji, fire.x, fire.y + 24);
    fire.x -= fire.speed;

    if (checkCollision(player, fire)) {
      lives--;
      playFireHitSound();
      showDamageFlash();
      fires.splice(i, 1);
      spawnFire();
    } else if (fire.x < -30) {
      fires.splice(i, 1);
      spawnFire();
    }
  }

  // Scoreboard
  ctx.fillStyle = "white";
  ctx.font = "20px monospace";
  ctx.fillText(`Punteggio: ${score} | `, 10, 30);

  // Cuori vite
  let hearts = "❤️".repeat(lives);
  ctx.fillText(hearts, 180, 30);

  // Timer
  ctx.fillText(`Tempo: ${gameTimer}s`, 320, 30);

  if (score >= 100) {
    playing = false;
    clearInterval(timerInterval);
    playWinSound();
    setTimeout(() => {
      winScreen.style.display = "flex";
    }, 300);
  }

  if (lives <= 0) {
  endGame();
}

  requestAnimationFrame(update);
}

function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + 24 &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + 24 &&
    rect1.y + rect1.h > rect2.y
  );
}

// Flash rosso danno
function showDamageFlash() {
  if (document.getElementById("damageFlash")) return;
  const flash = document.createElement("div");
  flash.id = "damageFlash";
  document.body.appendChild(flash);
  flash.style.display = "block";
  setTimeout(() => {
    flash.style.display = "none";
    document.body.removeChild(flash);
  }, 400);
}

// Key handlers
window.addEventListener("keydown", e => {
  keys[e.key] = true;
});
window.addEventListener("keyup", e => {
  keys[e.key] = false;
});

function endGame() {
  gameRunning = false;
  document.getElementById("finalScoreText").innerText = `Hai totalizzato: ${score} punti`;
  document.getElementById("gameOverScreen").classList.remove("hidden");
  cancelAnimationFrame(animationFrameId);
}

function restartGame() {
  // Reset variabili
  score = 0;
  lives = 3;
  player.x = canvas.width / 2 - player.width / 2;
  items = [];
  bombs = [];
  gameRunning = true;

  // Nasconde schermata Game Over
  document.getElementById("gameOverScreen").classList.add("hidden");

  // Riavvia il gioco
  startGame();
}

// Touch buttons handlers
upBtn.addEventListener("touchstart", () => (keys["ArrowUp"] = true));
upBtn.addEventListener("touchend", () => (keys["ArrowUp"] = false));
downBtn.addEventListener("touchstart", () => (keys["ArrowDown"] = true));
downBtn.addEventListener("touchend", () => (keys["ArrowDown"] = false));
leftBtn.addEventListener("touchstart", () => (keys["ArrowLeft"] = true));
leftBtn.addEventListener("touchend", () => (keys["ArrowLeft"] = false));
rightBtn.addEventListener("touchstart", () => (keys["ArrowRight"] = true));
rightBtn.addEventListener("touchend", () => (keys["ArrowRight"] = false));

// Button events
playBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => location.reload());

// Gestione dei comandi touch
document.getElementById("left-btn").addEventListener("touchstart", () => {
  moveLeft = true;
});
document.getElementById("left-btn").addEventListener("touchend", () => {
  moveLeft = false;
});
document.getElementById("right-btn").addEventListener("touchstart", () => {
  moveRight = true;
});
document.getElementById("right-btn").addEventListener("touchend", () => {
  moveRight = false;
});

