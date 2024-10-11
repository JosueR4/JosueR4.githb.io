// Obtener el elemento canvas y su contexto 2D
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Variables para almacenar las proporciones
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

// Establecer el tamaño inicial del canvas
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Cargar las imágenes necesarias
const volleyballImg = new Image();
volleyballImg.src = 'pelota1.png';

const canchaImg = new Image();
canchaImg.src = 'cancha.jpg';

const cancha2Img = new Image();
cancha2Img.src = 'cancha2.jpg';

const cancha3Img = new Image();
cancha3Img.src = 'cancha3.jpg';

const redesImg = new Image();
redesImg.src = 'redes.png';

// Configuración de la pelota
let ball = {
  x: canvasWidth * 0.15,
  y: canvasHeight / 2,
  radius: 0,
  gravity: 0.5 * (canvasHeight / 480),
  lift: -8 * (canvasHeight / 480),
  velocity: 0,
  angle: 0,
  rotationSpeed: 0.05
};

let pipes = [];
let pipeWidth = canvasWidth * 0.16;
let pipeHeight = canvasHeight * 0.41;
let pipeGap = canvasHeight * 0.21;
let pipeFrequency = 90;
let frameCount = 0;
let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameOver = false;
let gameStarted = false;
let paused = false;

// Variable para saber si el confeti ya fue mostrado en esta sesión de juego
let confetiMostrado = false;

// Obtener elementos adicionales
const pauseBtn = document.getElementById('pause-btn');
const pauseOverlay = document.getElementById('pause-overlay');
const resumeBtn = document.getElementById('resume-btn');
const exitMenuBtn = document.getElementById('exit-menu-btn');

const menu = document.getElementById('menu');
const gameContainer = document.getElementById('game-container');
const gameOverScreen = document.getElementById('game-over');
const bestScoreDisplay = document.getElementById('best-score');
const finalScoreDisplay = document.getElementById('final-score');
const exitGameBtn = document.getElementById('exit-game'); // Botón "Salir" en el menú

// Función para ajustar el tamaño de la pelota
function adjustBallSize() {
  const baseSize = 6;
  ball.radius = Math.min(canvasWidth, canvasHeight) * baseSize / 100;
}

// Inicializar el tamaño de la pelota
adjustBallSize();

// Actualizar el mejor puntaje en el menú
bestScoreDisplay.textContent = "Mejor Puntaje: " + bestScore;

// Función para hacer que la pelota salte
function jumpBall() {
  if (!paused && gameStarted) { // Solo permite flappear si no está pausado y el juego ha comenzado
    ball.velocity = ball.lift;
  }
}

// Asignar eventos de clic y toque al canvas para dispositivos móviles y de escritorio
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevenir comportamientos por defecto como el scroll
  jumpBall();
}, { passive: false });

canvas.addEventListener('click', (e) => {
  jumpBall();
});

// Eventos de botones
document.getElementById('start-btn').addEventListener('click', () => {
  menu.style.display = 'none';
  gameContainer.style.display = 'block';
  startGame();
});

document.getElementById('exit-game').addEventListener('click', () => {
  // Intentar cerrar la ventana (solo funcionará si fue abierta por JavaScript)
  window.close();

  // Si la ventana no se puede cerrar, redirigir a una página en blanco
  if (!window.closed) {
    window.location.href = 'about:blank';
  }
});

document.getElementById('restart-btn').addEventListener('click', () => {
  resetGame();
});

document.getElementById('exit-btn').addEventListener('click', () => {
  // Volver al menú principal
  gameOverScreen.style.display = 'none';
  gameContainer.style.display = 'none';
  menu.style.display = 'flex';
});

document.getElementById('exit-menu-btn').addEventListener('click', () => {
  // Salir al menú principal desde la pausa
  pauseOverlay.style.display = 'none';
  gameContainer.style.display = 'none';
  menu.style.display = 'flex';
  paused = false;
});

// Controlar la pelota con la tecla Espacio o Flecha arriba
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    jumpBall();
  }
});

// Evento para el botón de pausa
pauseBtn.addEventListener('click', () => {
  if (!gameOver && gameStarted) { // Solo permite pausar si el juego ha comenzado y no está terminado
    togglePause();
  }
});

// Evento para el botón de reanudar
resumeBtn.addEventListener('click', () => {
  togglePause();
});

// Función para alternar el estado de pausa
function togglePause() {
  paused = !paused;
  if (paused) {
    pauseOverlay.style.display = 'flex';
    cancelAnimationFrame(animationFrameId); // Detener la animación al pausar
  } else {
    pauseOverlay.style.display = 'none';
    animate(); // Reanuda la animación
  }
}

// Función para iniciar el juego
function startGame() {
  pipes = [];
  ball.y = canvasHeight / 2;
  ball.velocity = 0;
  ball.angle = 0; // Reiniciar ángulo al iniciar el juego
  score = 0;
  frameCount = 0;
  gameOver = false;
  gameStarted = true;
  paused = false;
  confetiMostrado = false; // Reiniciar la bandera de confeti al iniciar un nuevo juego
  pauseOverlay.style.display = 'none';
  animate();
}

// Función para generar las redes (pipes) aleatoriamente
function generatePipes() {
  // Generar una altura aleatoria para la red superior
  let topPipeHeight = Math.floor(Math.random() * (canvasHeight - pipeGap - pipeHeight));

  pipes.push({
    x: canvasWidth,
    topHeight: topPipeHeight, // Altura de la red superior
    bottomY: topPipeHeight + pipeGap // Posición Y de la red inferior
  });
}

// Función para dibujar el fondo de la cancha según el puntaje
function drawBackground() {
  if (score >= 40) {
    ctx.drawImage(cancha3Img, 0, 0, canvasWidth, canvasHeight);
  } else if (score >= 25) {
    ctx.drawImage(cancha2Img, 0, 0, canvasWidth, canvasHeight);
  } else {
    ctx.drawImage(canchaImg, 0, 0, canvasWidth, canvasHeight);
  }
}

// Función para dibujar la pelota con animación de giro
function drawBall() {
  ctx.save(); // Guardar el estado actual del contexto

  // Mover el origen de coordenadas al centro de la pelota
  ctx.translate(ball.x, ball.y);

  // Rotar el contexto según el ángulo actual de la pelota
  ctx.rotate(ball.angle);

  // Dibujar la imagen de la pelota centrada en (0, 0)
  ctx.drawImage(
    volleyballImg,
    -ball.radius, // Centrar la imagen horizontalmente
    -ball.radius, // Centrar la imagen verticalmente
    ball.radius * 2, // Ancho de la imagen
    ball.radius * 2 // Alto de la imagen
  );

  ctx.restore(); // Restaurar el estado del contexto
}

// Función para dibujar las redes
function drawPipes() {
  pipes.forEach(pipe => {
    // Dibujar red superior con imagen
    ctx.drawImage(redesImg, pipe.x, 0, pipeWidth, pipe.topHeight);
    // Dibujar red inferior con imagen
    ctx.drawImage(redesImg, pipe.x, pipe.bottomY, pipeWidth, canvasHeight - pipe.bottomY);
  });
}

// Función para actualizar la lógica del juego
function update() {
  if (paused) return; // No actualizar si está pausado

  // Actualizar la física de la pelota
  ball.velocity += ball.gravity;
  ball.y += ball.velocity;

  // Actualizar el ángulo para la animación de giro
  ball.angle += ball.rotationSpeed;

  // Verificar si la pelota toca el techo o el suelo
  if (ball.y + ball.radius > canvasHeight || ball.y - ball.radius < 0) {
    endGame();
  }

  // Filtrar las redes que ya salieron de la pantalla
  pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

  pipes.forEach(pipe => {
    // Mover las redes hacia la izquierda
    pipe.x -= 2 * (canvasWidth / 320); // Escalar velocidad según ancho del canvas

    // Incrementar el puntaje cuando la pelota pasa una red
    if (!pipe.passed && ball.x > pipe.x + pipeWidth) {
      pipe.passed = true;
      score++;

      // Cambiar el fondo según el puntaje
      // Esto se maneja en la función drawBackground()

      // Verificar si el nuevo puntaje supera el mejor puntaje
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
        bestScoreDisplay.textContent = "Mejor Puntaje: " + bestScore;

        // Disparar el confeti solo una vez al romper el récord
        if (!confetiMostrado) {
          launchConfetti();
          confetiMostrado = true;
        }
      }

      // Verificar si se alcanza el umbral para cambiar el fondo
      if (score === 25 || score === 40) {
        // Puedes agregar aquí cualquier lógica adicional al cambiar el fondo
        // Por ejemplo, un breve efecto de transición
      }
    }

    // Verificar colisiones con las redes
    if (ball.x > pipe.x && ball.x < pipe.x + pipeWidth) {
      if (ball.y < pipe.topHeight || ball.y > pipe.bottomY) {
        endGame();
      }
    }
  });

  // Generar nuevas redes cada cierto tiempo
  if (frameCount % pipeFrequency === 0) {
    generatePipes();
  }

  frameCount++;
}

// Variable para controlar el frame actual
let animationFrameId;

// Función de animación del juego
function animate() {
  if (gameOver || paused) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Dibujar el fondo de la cancha según el puntaje
  drawBackground();

  // Dibujar la pelota y las redes
  drawBall();
  drawPipes();

  // Actualizar la lógica del juego
  update();

  // Dibujar el puntaje en la pantalla con contorno blanco
  const fontSize = canvasHeight * 0.04;
  ctx.font = `${fontSize}px 'Arial Black', Arial, sans-serif`; // Fuente Arial Black
  ctx.fillStyle = "#000"; // Texto negro
  ctx.textAlign = "left";

  // Dibujar contorno blanco
  ctx.lineWidth = fontSize * 0.05; // Ajusta el grosor del contorno según el tamaño de la fuente
  ctx.strokeStyle = "#fff"; // Contorno blanco
  ctx.strokeText("Puntaje: " + score, canvasWidth * 0.02, canvasHeight * 0.05);

  // Dibujar el texto relleno
  ctx.fillText("Puntaje: " + score, canvasWidth * 0.02, canvasHeight * 0.05);

  // Solicitar el siguiente frame
  animationFrameId = requestAnimationFrame(animate);
}

// Función para manejar el fin del juego
function endGame() {
  gameOver = true;
  gameOverScreen.style.display = 'block';
  finalScoreDisplay.textContent = "Puntaje: " + score;

  // Actualizar el mejor puntaje si es necesario
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('bestScore', bestScore);
    bestScoreDisplay.textContent = "Mejor Puntaje: " + bestScore;

    // Disparar el confeti solo una vez al romper el récord
    if (!confetiMostrado) {
      launchConfetti();
      confetiMostrado = true;
    }
  }

  // Cancelar la animación
  cancelAnimationFrame(animationFrameId);
}

// Función para reiniciar el juego
function resetGame() {
  gameOverScreen.style.display = 'none';
  startGame();
}

// Función para ajustar el tamaño del canvas y de los elementos cuando se redimensiona la ventana
function resizeCanvas() {
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // Ajustar tamaño de la pelota
  adjustBallSize();

  // Ajustar dimensiones de las redes
  pipeWidth = canvasWidth * 0.16;
  pipeHeight = canvasHeight * 0.41;
  pipeGap = canvasHeight * 0.21;

  // Actualizar la posición de la pelota
  if (!gameStarted) {
    ball.x = canvasWidth * 0.15;
    ball.y = canvasHeight / 2;
  }

  // Redibujar el fondo y otros elementos si es necesario
  if (gameStarted && !gameOver && !paused) {
    drawBackground();
  }
}

// Evento para redimensionar el canvas al cambiar el tamaño de la ventana
window.addEventListener('resize', resizeCanvas);

// Llamar a la función de redimensionamiento al cargar la página
resizeCanvas();

/**
 * Función para lanzar el confeti utilizando Canvas Confetti
 */
function launchConfetti() {
  // Personalizar los parámetros del confeti
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 }
  });

  // Hacer que el confeti dure un poco más llamando la función varias veces
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, 500);
}