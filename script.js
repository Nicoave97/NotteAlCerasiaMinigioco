const canvas = document.getElementById("gameCanvas");
const btnApriClassifica = document.getElementById("apriClassificaBtn");
document.getElementById("apriClassificaBtn").addEventListener("click", caricaClassifica);

const paroleVietate = [
  // Volgari e bestemmie (senza "maria")
  "dio", "gesù", "madonna", "porcodio", "porco", "crist0", "d1o", "d1o", "gesu", "cristo",

  // Volgari classici
  "cazzo", "merda", "vaffanculo", "stronzo", "troia", "puttana", "bastardo", "bastarda",
  "culo", "figa", "sborra", "succhiami", "scopami", "chiavami", "pisello", "vagina", "dildo",
  "pezzo di merda", "suca", "fottiti", "inculo", "leccaculo", "coglione", "cogliona",

  // Varianti con simboli o mascherate
  "v@ff", "tr0ia", "putt@na", "c@zzo", "m3rda", "v4ff", "str0nzo", "f1ga", "cul@", "fig@",
  "sc0pami", "chi@vami", "suc@",

  // Insulti personali o razzisti
  "mongolo", "handicappato", "ritardato", "negro", "zingaro", "ebreo", "frocio", "finocchio",
  "lesbica", "gay", "islamico", "musulmano", "terrone", "polentone", "down", "malato", "scemo",
  "idiota", "imbecille", "cretino", "stupido", "deficiente", "brutta", "vai a cagare", "muori",

  // In inglese
  "fuck", "shit", "bitch", "asshole", "motherfucker", "fucker", "cunt", "whore", "slut", "dick", "nigger",

  // Anti-spam o troll
  "admin", "root", "www", "http", "https"
];

// --- Suoni realistici ---
const audioBonus = new Audio("asset/audio/bonus.mp3");
const audioHit = new Audio("asset/audio/hit.mp3");
const audioLose = new Audio("asset/audio/lose.mp3");
const audioStart = new Audio("asset/audio/startMusic.mp3");

[audioBonus, audioHit, audioLose, audioStart].forEach(audio => {
  audio.preload = 'auto';
});

// Imposta volume base
audioBonus.volume = 0.6;
audioHit.volume = 0.7;
audioStart.volume = 0.8;
audioLose.volume = 0.6;
audioStart.loop = true; // musica in loop

let playing = false;

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

   if (playing) return; // ❗ Non ridimensionare durante il gioco

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
const clocks = [];
const clockEmoji = "⏱️";
let clockSpawnTimer = Date.now();
let score = 0;
let lives = 3;
 let hearts = [];  // Array per vite bonus
let collected = 0;
let gameTimer = 45;
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

  // Mostra schermata iniziale e resetta correttamente i bottoni
  startScreen.style.display = "flex";
 // canvas.style.display = "none";
  btnApriClassifica.style.display = "block";
  document.getElementById("apriRegoleBtn").style.display = "block";
  return;
}

  // Verifica nome offensivo
  if (contieneParoleOffensive(nome)) {
    alert("Il nome inserito contiene parole non consentite.");
   startScreen.style.display = "flex";
 // canvas.style.display = "none";
    btnApriClassifica.style.display = "block";
   document.getElementById("apriRegoleBtn").style.display = "block";

    return;
  }

nomeGiocatore = nome;
 

 

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

  gameTimer =45;
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
  
ctx.textBaseline = "top";
ctx.textAlign = "left";
ctx.imageSmoothingEnabled = false;
ctx.font = "12px 'Press Start 2P', monospace"; // font coerente per l'HUD


  
  if (!playing) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

 if (joystick.dragging) {
  const maxSpeed = 3; // velocità massima costante
  const distance = Math.sqrt(joystick.deltaX ** 2 + joystick.deltaY ** 2);
  const angle = Math.atan2(joystick.deltaY, joystick.deltaX);

  // Normalizza la velocità in base alla distanza dal centro
  const speedFactor = Math.min(distance / 40, 1); // da 0 a 1
  const speed = maxSpeed * speedFactor;

  player.x += Math.cos(angle) * speed;
  player.y += Math.sin(angle) * speed;
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
    ctx.font = "28px 'Press Start 2P'";
   
    ctx.fillText(item.emoji, item.x, item.y + 24);
    item.x -= item.speed;

    

   if (checkCollision(player, item, 28, 28)) {
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
    ctx.font = "28px 'Press Start 2P'";
    ctx.fillText(fire.emoji, fire.x, fire.y + 24);
    fire.x -= fire.speed;


   // ctx.strokeStyle = "red";
//ctx.strokeRect(fire.x, fire.y + 22, 24, 28);
  if (checkCollision(player, fire, 0, 22, 24, 28)) {
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
ctx.font = "bold 12px 'Press Start 2P', monospace";
ctx.textBaseline = "top";
ctx.textAlign = "left";
ctx.imageSmoothingEnabled = false;

// PUNTEGGIO
ctx.fillStyle = "white";
ctx.save();
ctx.font = "bold 12px 'Press Start 2P', monospace";
ctx.textBaseline = "top";
ctx.textAlign = "left";
ctx.fillStyle = "white"; // o altro colore
ctx.imageSmoothingEnabled = false;
ctx.fillText(`Punteggio: ${score}`, 10, 30);
ctx.restore();

clocks.forEach(clock => {
  ctx.font = "28px 'Press Start 2P'";
  ctx.fillText(clock.emoji, clock.x, clock.y);
});

// VITE
ctx.fillText("❤️".repeat(lives), 10, 60);
ctx.font = "bold 12px 'Press Start 2P', monospace";

// TIMER (diventa rosso se <=10 secondi)
ctx.font = "bold 12px 'Press Start 2P', monospace";
if (gameTimer <= 10) {
  ctx.fillStyle = (gameTimer % 2 === 0) ? "red" : "orange"; // lampeggia tra rosso/arancione
  ctx.font = "bold 12px 'Press Start 2P', monospace";
} else {
  ctx.fillStyle = "white";
  ctx.font = "bold 12px 'Press Start 2P', monospace";
}
// Lampeggio bordo negli ultimi 10 secondi
if (gameTimer <= 10) {
  ctx.font = "bold 12px 'Press Start 2P', monospace";
  canvas.style.borderColor = (gameTimer % 2 === 0) ? "red" : "orange";
} else if (canvas.style.borderColor !== "#ffa502") {
  ctx.font = "bold 12px 'Press Start 2P', monospace";
  canvas.style.borderColor = "#ffa502"; // colore normale
}
ctx.fillText(`Tempo: ${gameTimer}s`, canvas.width - 120, 30);
ctx.font = "bold 12px 'Press Start 2P', monospace";



  if (lives <= 0) {
  playing = false;
  clearInterval(timerInterval);
  mostraGameOver();
}

if (Date.now() - clockSpawnTimer > 5000) {
  generaOrologioBonus();
  clockSpawnTimer = Date.now();
}

clocks.forEach((clock, index) => {
  clock.x -= clock.speed;

  // Se esce dallo schermo, rimuovilo
  if (clock.x + 24 < 0) {
    clocks.splice(index, 1);
  }

  // Collisione con player
  if (
    player.x < clock.x + 24 &&
    player.x + player.width > clock.x &&
    player.y < clock.y + 24 &&
    player.y + player.height > clock.y
  ) {
    gameTimer += 5;
    mostraMessaggio("+5 secondi!");
    clocks.splice(index, 1);
  }
});
  


// Vite bonus 💖
for (let i = hearts.length - 1; i >= 0; i--) {
  const heart = hearts[i];
  ctx.font = "28px 'Press Start 2P'";
  ctx.fillText(heart.emoji, heart.x, heart.y + 24);
  heart.x -= heart.speed;

  if (checkCollision(player, heart, 28, 28)) {
    if (lives < 5) lives++;  // limite massimo 5
    playBonusSound(); // riutilizziamo il suono
    hearts.splice(i, 1);
  } else if (heart.x < -30) {
    hearts.splice(i, 1);
  }
}
  requestAnimationFrame(update);
}


function checkCollision(r1, r2, offsetX = 0, offsetY = 0, width = 24, height = 24) {
  return (
    r1.x < r2.x + offsetX + width &&
    r1.x + r1.width > r2.x + offsetX &&
    r1.y < r2.y + offsetY + height &&
    r1.y + r1.height > r2.y + offsetY
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
    per confermare il tuo punteggio!</p>
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
  div.style.font =  "20px 'Press Start 2P'";
  document.body.appendChild(div);

  setTimeout(() => div.remove(), 1000);
}

function generaOrologioBonus() {
  if (Math.random() < 10.0) { // 50% di possibilità
    clocks.push({
      x: canvas.width + Math.random() * 300,
      y: Math.random() * (canvas.height - 24),
      emoji: clockEmoji,
      speed: 2.5
    });
  }
} 

function contieneParoleOffensive(nome) {
  const nomeLower = nome.toLowerCase();
  return paroleVietate.some(parola => nomeLower.includes(parola));
}

