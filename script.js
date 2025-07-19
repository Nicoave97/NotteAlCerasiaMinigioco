const canvas = document.getElementById("gameCanvas");

//function resizeCanvasToScreen() {
  //const containerWidth = Math.min(window.innerWidth, 800);
  //canvas.width = containerWidth;
  //canvas.height = containerWidth / 2; // mantieni proporzioni 2:1
//}
//window.addEventListener("resize", resizeCanvasToScreen);
//resizeCanvasToScreen();

const ctx = canvas.getContext("2d");

// Ridimensiona canvas in base allo schermo
function resizeCanvas() {
  const isMobile = window.innerWidth < 950;
  const padding = 20; // margine di sicurezza

  const width = isMobile ? window.innerWidth - padding : 800;
  const height = isMobile ? window.innerHeight - padding * 2 : 400;

  canvas.width = width;
  canvas.height = height;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Joystick analogico
let joystick = {
  dragging: false,
  startX: 0,
  startY: 0,
  deltaX: 0,
  deltaY: 0
};

ctx.strokeStyle = "#ffa502";
ctx.lineWidth = 4;
ctx.strokeRect(0, 0, canvas.width, canvas.height);

const joystickEl = document.getElementById("joystick");
joystickEl.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  joystick.dragging = true;
  joystick.startX = touch.clientX;
  joystick.startY = touch.clientY;
});

window.addEventListener("touchmove", e => {
  if (!joystick.dragging) return;
  const touch = e.touches[0];
  joystick.deltaX = touch.clientX - joystick.startX;
  joystick.deltaY = touch.clientY - joystick.startY;

  const distance = Math.sqrt(joystick.deltaX ** 2 + joystick.deltaY ** 2);
  const maxDistance = 40;
  if (distance > maxDistance) {
    const angle = Math.atan2(joystick.deltaY, joystick.deltaX);
    joystick.deltaX = Math.cos(angle) * maxDistance;
    joystick.deltaY = Math.sin(angle) * maxDistance;
  }

  joystickEl.style.transform = `translate(${joystick.deltaX}px, ${joystick.deltaY}px)`;
});

window.addEventListener("touchend", () => {
  joystick.dragging = false;
  joystick.deltaX = 0;
  joystick.deltaY = 0;
  joystickEl.style.transform = `translate(-50%, -50%)`;
});

const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");
const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");

let player = { x: 50, y: 180, width: 50, height: 50 };
let keys = {};
let items = [];
let fires = [];
let score = 0;
let lives = 3;
let collected = 0;
let playing = false;
let gameTimer = 30;
let timerInterval;

let bombSpeed = 2;               // Velocità iniziale delle bombe
let maxBombs = 6;                // Numero massimo di bombe all'inizio
let difficultyTimer = 0;         // Per tenere traccia del tempo
let difficultyInterval = 5000;  // Aumenta difficoltà ogni 5 secondi


const bonusEmojis = ["🍕", "🎧", "🍸"];
const fireEmoji = "🔥";

let soundEnabled = true;

const toggleSoundBtn = document.getElementById("toggleSoundBtn");

toggleSoundBtn.addEventListener("click", () => {
  // Inverte il valore della variabile: true → false, false → true
  soundEnabled = !soundEnabled;

  // Cambia il testo sul bottone in base allo stato
  toggleSoundBtn.textContent = soundEnabled ? "🔊 Suoni ON" : "🔇 Suoni OFF";
});

const logoImg = new Image();
logoImg.src = "asset/image/logo.png";

// Suoni
function playSound(start, end, duration = 0.3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(start, now);
    gain.gain.setValueAtTime(0.3, now);
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.frequency.linearRampToValueAtTime(end, now + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.stop(now + duration);
    osc.onended = () => ctx.close();
  } catch (e) {}
}
function playBonusSound() {
  if (soundEnabled) playSound(600, 900, 0.15);
}
function playFireHitSound() {
  if (soundEnabled) playSound(150, 100, 0.5);
}
function playWinSound() {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [660, 880, 990];
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.connect(ctx.destination);

    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, now + i * 0.25);
      osc.connect(gain);
      osc.start(now + i * 0.25);
      osc.stop(now + i * 0.25 + 0.2);
    });

    setTimeout(() => ctx.close(), notes.length * 300);
  } catch (e) {}
}
function playLoseGameSound() {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, now);
    gain.gain.setValueAtTime(0.3, now);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1);
    osc.stop(now + 1);
    osc.onended = () => ctx.close();
  } catch (e) {}
}

// Inizio gioco
function startGame() {
  startScreen.style.display = "none";
  winScreen.style.display = "none";

  playing = true;
  score = 0;
  lives = 3;
  collected = 0;
  player.x = 50;
  player.y = canvas.height / 2 - player.height / 2;
  items = [];
  fires = [];

  for (let i = 0; i < 7; i++) spawnItem();
  for (let i = 0; i < 10; i++) spawnFire();

  gameTimer = 30;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    gameTimer--;
    if (gameTimer <= 0) {
 
     // playLoseGameSound();
      //alert("Tempo scaduto! Partita Terminata!");
      //location.reload();
          playing = false;
    clearInterval(timerInterval);
    playWinSound();
    setTimeout(() => winScreen.style.display = "flex", 300);
    document.getElementById("finalScoreTextWin").innerText = `Hai totalizzato: ${score} punti`;
    }
  }, 1000);

  requestAnimationFrame(update);
}

function spawnItem() {
  items.push({
    x: canvas.width + Math.random() * 300,
    y: Math.random() * (canvas.height - 24),
    emoji: bonusEmojis[Math.floor(Math.random() * bonusEmojis.length)],
    speed: 2.5
  });
}

function spawnFire() {
  fires.push({
    x: canvas.width + Math.random() * 300,
    y: Math.random() * (canvas.height - 24),
    emoji: fireEmoji,
    speed: 3.5
  });
}

function update() {
  if (!playing) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Movimento con joystick
  if (joystick.dragging) {
    let speed = 0.10;
    player.x += joystick.deltaX * speed;
    player.y += joystick.deltaY * speed;
  }

  // Movimento da tastiera
  if (keys["ArrowUp"] && player.y > 0) player.y -= 3;
  if (keys["ArrowDown"] && player.y + player.height < canvas.height) player.y += 3;
  if (keys["ArrowLeft"] && player.x > 0) player.x -= 3;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += 3;

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.height, player.y));

  // Disegna giocatore
  if (logoImg.complete) {
    ctx.drawImage(logoImg, player.x, player.y, player.width, player.height);
  }

  // Oggetti bonus
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

  // Ostacoli
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

  // HUD
ctx.fillStyle = "white";
ctx.font = "18px monospace";
ctx.fillText(`Punteggio: ${score}`, 10, 30);
ctx.fillText("❤️".repeat(lives), 10, 60);
ctx.fillText(`Tempo: ${gameTimer}s`, canvas.width - 120, 30);



  if (score >= 10000 ) {
    playing = false;
    clearInterval(timerInterval);
    playWinSound();
    setTimeout(() => winScreen.style.display = "flex", 300);
  }

  if (lives <= 0) endGame();

if (Date.now() - difficultyTimer > difficultyInterval) {
  bombSpeed += 0.5; // Bombe più veloci
  fires.forEach(fire => fire.speed = bombSpeed);

  if (fires.length < maxBombs) {
    fires.push({
      x: canvas.width + Math.random() * 300,
      y: Math.random() * (canvas.height - 24),
      emoji: fireEmoji,
      speed: bombSpeed
    });
  }

  difficultyTimer = Date.now(); // Reset timer
}
  requestAnimationFrame(update);
}


function checkCollision(r1, r2) {
  return (
    r1.x < r2.x + 24 &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + 24 &&
    r1.y + r1.height > r2.y
  );
}

function showDamageFlash() {
  if (document.getElementById("damageFlash")) return;
  const flash = document.createElement("div");
  flash.id = "damageFlash";
  flash.style.position = "absolute";
  flash.style.top = "0";
  flash.style.left = "0";
  flash.style.width = "100%";
  flash.style.height = "100%";
  flash.style.background = "rgba(255,0,0,0.5)";
  flash.style.zIndex = "999";
  document.body.appendChild(flash);
  setTimeout(() => document.body.removeChild(flash), 400);
}

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

function endGame() {
  playing = false;
  document.getElementById("finalScoreText").innerText = `Hai totalizzato: ${score} punti`;
  document.getElementById("gameOverScreen").classList.remove("hidden");
}

function restartGame() {
  document.getElementById("gameOverScreen").classList.add("hidden");
  startGame();
}

playBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", () => location.reload());

// Impedisce lo scroll quando tocchi il joystick
document.body.addEventListener("touchstart", (e) => {
  if (e.target.closest("#joystick-container")) {
    e.preventDefault(); // blocca il comportamento di default (es: scroll)
  }
}, { passive: false });