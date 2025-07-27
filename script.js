const canvas = document.getElementById("gameCanvas");
const btnApriClassifica = document.getElementById("apriClassificaBtn");
document.getElementById("apriClassificaBtn").addEventListener("click", caricaClassifica);

// --- Suoni realistici ---
const audioBonus = new Audio("asset/audio/bonus.mp3");
const audioHit = new Audio("asset/audio/hit.mp3");
const audioLose = new Audio("asset/audio//lose.mp3");
const audioStart = new Audio("asset/audio/startMusic.mp3");


// Imposta volume base
audioBonus.volume = 0.6;
audioHit.volume = 0.7;
audioStart.volume = 0.8;
audioLose.volume = 0.6;
audioStart.loop = true; // musica in loop

//function resizeCanvafsToScreen() {
  //const containerWidth = Math.min(window.innerWidth, 800);
  //canvas.width = containerWidth;
  //canvas.height = containerWidth / 2; // mantieni proporzioni 2:1
//}
//window.addEventListener("resize", resizeCanvasToScreen);
//resizeCanvasToScreen();

const ctx = canvas.getContext("2d");

// Ridimensiona canvas in base allo schermo
//function resizeCanvas() {
  //const isMobile = window.innerWidth < 950;
  //const padding = 20; // margine di sicurezza

  //const width = isMobile ? window.innerWidth - padding : 800;
  //const height = isMobile ? window.innerHeight - padding * 2 : 400;

//  canvas.width = width;
  //canvas.height = height;
//}


function resizeCanvas() {
  const maxWidth = 800;
  const maxHeight = 630;

  const availableWidth = window.innerWidth - 20;
  const availableHeight = window.innerHeight - 20;

  const width = Math.min(availableWidth, maxWidth);
  const height = Math.min(availableHeight, maxHeight);

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

const playBtn = document.getElementById("playBtn");
const restartBtn = document.getElementById("restartBtn");

let player = { x: 50, y: 180, width: 50, height: 50 };
let keys = {};
let items = [];
let fires = [];
let score = 0;
let lives = 3;
 let hearts = [];  // Array per vite bonus
let collected = 0;
let playing = false;
let gameTimer = 30;
let timerInterval;
let nomeGiocatore = '';

let bombSpeed = 2;               // Velocità iniziale delle bombe
let maxBombs = 5;                // Numero massimo di bombe all'inizio
let difficultyTimer = 0;         // Per tenere traccia del tempo
let difficultyInterval = 5000;  // Aumenta difficoltà ogni 5 secondi



const bonusEmojis = ["🍕", "🎧", "🍸"];
const fireEmoji = "🔥";

let soundEnabled = true;

const toggleSoundBtn = document.getElementById("toggleSoundBtn");

toggleSoundBtn.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  toggleSoundBtn.textContent = soundEnabled ? "🔊 Suoni ON" : "🔇 Suoni OFF";

  if (!soundEnabled) {
    // Stop immediato di tutti i suoni attivi
    audioBonus.pause();
    audioHit.pause();
    audioStart.pause();
    audioStart.pause();

    // Resetta la posizione a inizio per sicurezza
    audioBonus.currentTime = 0;
    audioHit.currentTime = 0;
    audioStart.currentTime = 0;
    audioStart.currentTime = 0;
  } else {
    // Se sei sulla schermata iniziale, riavvia la musica start
    if (startScreen.style.display !== "none") {
      audioStart.play();
      audioStart.volume = 0.6;
    }
  }
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
  if (soundEnabled) {
    audioBonus.currentTime = 0;
    audioBonus.play();
  }
}

function playFireHitSound() {
  if (soundEnabled) {
    audioHit.currentTime = 0;
    audioHit.play();
  }
}
function playWinSound() {
  playResultSound();
}

function playLoseGameSound() {
  playResultSound();
}

function playResultSound() {
  if (soundEnabled) {
    audioStart.currentTime = 0;
    audioStart.play();
  }
}



// Inizio gioco
function startGame() {
  startScreen.style.display = "none";

  btnApriClassifica.style.display = "none";
  document.getElementById("apriRegoleBtn").style.display = "none";

  playing = true;
  score = 0;
  lives = 3;
  collected = 0;
  player.x = 50;
  player.y = canvas.height / 2 - player.height / 2;
  items = [];
  fires = [];

    const input = document.getElementById("playerName");
  const nome = input.value.trim();

  if (nome === "") {
    alert("Per favore, inserisci il tuo nome prima di iniziare.");
      document.getElementById("startScreen").style.display = "block";
      document.getElementById("gameCanvas").style.display = "block"; // se usi un canvas
    return;
  }

  nomeGiocatore = nome;
  if (nome === "") {
  alert("Per favore, inserisci il tuo nome prima di iniziare.");
  document.getElementById("startScreen").style.display = "block";
  return;
}

// Abbassa musica di sottofondo
if (soundEnabled) {
  audioStart.volume = 0.1;
}

  // Nascondi schermata iniziale, mostra il canvas o avvia il gioco
  //document.getElementById("startScreen").style.display = "none";
  //document.getElementById("gameCanvas").style.display = "block"; // se usi un canvas
  //startLoop(); // o avvia il gioco

 

  for (let i = 0; i < 7; i++) spawnItem();
  for (let i = 0; i < 10; i++) spawnFire();

  gameTimer = 30;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    gameTimer--;
  if (gameTimer <= 0) {
  playing = false;
  clearInterval(timerInterval);
  mostraGameOver();

}
  }, 1000);

  setInterval(() => {
  if (playing) spawnHeart();
}, 5000); // ogni 5 secondi
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

function spawnHeart() {
  hearts.push({
    x: canvas.width + Math.random() * 300,
    y: Math.random() * (canvas.height - 24),
    emoji: "💖",
    speed: 2
  });
}


function showHitAlert() {
  const alert = document.getElementById("hitAlert");
  if (!alert) return;

  // reset animazione
  alert.style.animation = "none";
  alert.offsetHeight; // forza il reflow per riattivare l'animazione
  alert.style.animation = "alertFlash 1s ease";

  // Mostra l’elemento per sicurezza
  alert.style.opacity = "1";
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
      showHitAlert(); 
      fires.splice(i, 1);
      spawnFire();
    } else if (fire.x < -30) {
      fires.splice(i, 1);
      spawnFire();
    }
  }

  

  // HUD
ctx.font = "18px monospace";

// PUNTEGGIO
ctx.fillStyle = "white";
ctx.fillText(`Punteggio: ${score}`, 10, 30);

// VITE
ctx.fillText("❤️".repeat(lives), 10, 60);

// TIMER (diventa rosso se <=10 secondi)
if (gameTimer <= 10) {
  ctx.fillStyle = (gameTimer % 2 === 0) ? "red" : "orange"; // lampeggia tra rosso/arancione
} else {
  ctx.fillStyle = "white";
}
// Lampeggio bordo negli ultimi 3 secondi
if (gameTimer <= 3) {
  canvas.style.borderColor = (gameTimer % 2 === 0) ? "red" : "orange";
} else if (canvas.style.borderColor !== "#ffa502") {
  canvas.style.borderColor = "#ffa502"; // colore normale
}
ctx.fillText(`Tempo: ${gameTimer}s`, canvas.width - 120, 30);



  if (lives <= 0) {
  playing = false;
  clearInterval(timerInterval);
  mostraGameOver();
}



// Difficoltà aumentata solo se il timer è sotto i 20 secondi
if (gameTimer < 20 && Date.now() - difficultyTimer > difficultyInterval) {
   bombSpeed *= 2.0; // aumento progressivo
  maxBombs += 1;
  fires.forEach(fire => fire.speed = bombSpeed);

  canvas.style.borderColor = (canvas.style.borderColor === "red") ? "#ffa502" : "red";
  mostraMessaggio("⚡ TURBO MODE!");

  if (fires.length < maxBombs) {
    fires.push({
      x: canvas.width + Math.random() * 300,
      y: Math.random() * (canvas.height - 24),
      emoji: fireEmoji,
      speed: bombSpeed
    });
  }

  difficultyTimer = Date.now();
}
// Vite bonus 💖
for (let i = hearts.length - 1; i >= 0; i--) {
  const heart = hearts[i];
  ctx.font = "28px serif";
  ctx.fillText(heart.emoji, heart.x, heart.y + 24);
  heart.x -= heart.speed;

  if (checkCollision(player, heart)) {
    if (lives < 5) lives++;  // limite massimo 5
    playBonusSound(); // riutilizziamo il suono
    hearts.splice(i, 1);
  } else if (heart.x < -30) {
    hearts.splice(i, 1);
  }
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
  let flash = document.getElementById("damageFlash");

  if (!flash) {
    flash = document.createElement("div");
    flash.id = "damageFlash";
    document.body.appendChild(flash);
  }

  flash.classList.remove("active");
  void flash.offsetWidth; // forza reflow per riattivare animazione
  flash.classList.add("active");

  setTimeout(() => {
    flash.classList.remove("active");
  }, 400);
}

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

function endGame() {
  playing = false;
  document.getElementById("finalScoreText").innerText = `Hai totalizzato: ${score} punti`;
  document.getElementById("gameOverScreen").classList.remove("hidden");
  // Quando finisce il gioco
let nome = nomeGiocatore
salvaPunteggio(nome, score);


}

function restartGame() {
  document.getElementById("gameOverScreen").classList.add("hidden");
  startGame();
}

playBtn.addEventListener("click", startGame);
//restartBtn.addEventListener("click", restartGame);

// Impedisce lo scroll quando tocchi il joystick
document.body.addEventListener("touchstart", (e) => {
  if (e.target.closest("#joystick-container")) {
    e.preventDefault(); // blocca il comportamento di default (es: scroll)
  }
}, { passive: false });


function salvaPunteggio(nome, punteggio) {
  const now = new Date().toISOString();

  firebase.database().ref("punteggi").push({
    nome: nome,
    punteggio: punteggio,
    data: now
  });
}


 const classificaDiv = document.getElementById("classificaContainer");

  //document.getElementById("apriClassificaBtn").addEventListener("click", () => {
    //classificaDiv.style.display = "block";
    //caricaClassifica();
 // });



 function caricaClassifica() {
  const classificaRef = firebase.database().ref("punteggi").orderByChild("punteggio").limitToLast(10);

  classificaRef.once("value")
    .then(snapshot => {
      const dati = [];

      snapshot.forEach(childSnapshot => {
        dati.push(childSnapshot.val());
      });

      // Ordina in ordine decrescente di punteggio
      dati.sort((a, b) => b.punteggio - a.punteggio);

     let html = `
  <button id="classificaChiudiIcon" onclick="document.getElementById('classificaContainer').style.display = 'none'">Chiudi</button>
  <h3>Classifica Top 10</h3>
  <ol style='text-align: left;'>
`;
   dati.forEach(entry => {
  const data = new Date(entry.data).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });
  html += `<li><strong>${entry.nome}</strong>: ${entry.punteggio} punti<br><small>${data}</small></li>`;
});

html += "</ol><button onclick=\"document.getElementById('classificaContainer').style.display = 'none'\">Chiudi</button>";
      

      const classificaContainer = document.getElementById("classificaContainer");
      classificaContainer.innerHTML = html;
      classificaContainer.style.display = "block";
    })
    .catch(error => {
      console.error("Errore nel caricamento della classifica:", error);
    });
}

  function chiudiClassifica() {
    classificaDiv.style.display = "none";
  }
  

 function mostraGameOver() {
  document.getElementById("finalScoreText").innerHTML = `
    <strong>Tempo esaurito o vite terminate!</strong><br>
    <p><strong>${nomeGiocatore}</strong></p>
    <p>Hai totalizzato: <strong>${score}</strong> punti</p>
    <p>Effettua uno screen e taggaci, o invialo alla nostra pagina Instagram<br>
    per scoprire se hai vinto l’omaggio snack & bevanda!</p>
  `;

  document.getElementById("gameOverScreen").classList.remove("hidden");
  salvaPunteggio(nomeGiocatore, score);
}

function tornaAllaHome() {
  document.getElementById("gameOverScreen").classList.add("hidden");
  startScreen.style.display = "flex";
  btnApriClassifica.style.display = "block";
  document.getElementById("apriRegoleBtn").style.display = "block";
}

window.addEventListener("load", () => {
  if (soundEnabled) {
    audioStart.play().catch(() => {
      // Utente deve interagire prima per sbloccare autoplay
    });
  }
}); 




document.getElementById("apriRegoleBtn").addEventListener("click", () => {
  document.getElementById("regoleModal").style.display = "block";
});

function chiudiRegole() {
  document.getElementById("regoleModal").style.display = "none";
}

function mostraMessaggio(testo) {
  const div = document.createElement("div");
  div.innerText = testo;
  div.style.position = "fixed";
  div.style.top = "50%";
  div.style.left = "50%";
  div.style.transform = "translate(-50%, -50%)";
  div.style.fontSize = "2rem";
  div.style.color = "#ffdd57";
  div.style.background = "rgba(0,0,0,0.7)";
  div.style.padding = "20px 30px";
  div.style.borderRadius = "12px";
  div.style.zIndex = 9999;
  div.style.boxShadow = "0 0 20px #ffa502";
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 1000);
}