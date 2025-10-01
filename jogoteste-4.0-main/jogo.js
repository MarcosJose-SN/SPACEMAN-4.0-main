// Corrige travamento ao alternar rapidamente entre esquerda e direita e deixa mais rápido
let lastDirection = null;
let movingLeft = false;
let movingRight = false;
function moveRight() {
    if (lastDirection === 'left') spaceship.dx = 0;
    movingRight = true;
    lastDirection = 'right';
    if (!movingLeft) spaceship.dx = Math.abs(spaceship.dx);
}
function moveLeft() {
    if (lastDirection === 'right') spaceship.dx = 0;
    movingLeft = true;
    lastDirection = 'left';
    if (!movingRight) spaceship.dx = -Math.abs(spaceship.dx);
}
function stopRight() { movingRight = false; }
function stopLeft() { movingLeft = false; }
// --- Setup básico do canvas e contexto ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 600;

// --- Variáveis do jogo ---
let score = 0;
let time = 0;
let lives = 1;
let gameOver = false;
let highScore = localStorage.getItem("highScore") || 0;

// --- Nave ---
let spaceship = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 50,
    speed: 13, // velocidade máxima ainda maior
    dx: 0,
    hit: false,
    hitTime: 0,
    accel: 2.5, // aceleração mais forte
    friction: 0.7 // desaceleração menor (responde mais rápido)
};

// --- Obstáculos ---
let obstacles = [];
let lastObstacleTime = 0;
let spawnInterval = 800;  // Intervalo inicial
let baseObstacleSpeed = 3; // Velocidade base inicial dos obstáculos

// --- Controle de tempo ---
let lastScoreUpdate = Date.now();
let lastTimeUpdate = Date.now();

// --- Sons ---
const soundCollision = new Audio("collision.wav");
const soundLife = new Audio("life.wav");
const soundGameOver = new Audio("gameover.wav");

// --- Funções de desenho ---
function drawSpaceship() {
    if (spaceship.hit) {
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = "red";
        } else {
            ctx.fillStyle = "white";
        }
        if (Date.now() - spaceship.hitTime > 500) {
            spaceship.hit = false;
        }
    } else {
        ctx.fillStyle = "white";
    }
    ctx.fillRect(spaceship.x, spaceship.y, spaceship.width, spaceship.height);
}

function drawObstacles() {
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        ctx.fillStyle = "gray";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        obstacle.y += obstacle.speed;

        if (obstacle.y > canvas.height) {
            obstacles.splice(i, 1);
            i--;
        }
    }
}

// --- Criação de obstáculos ---
// Cria 2 obstáculos a cada spawn para mais desafio
function createObstacle() {
    for (let j = 0; j < 2; j++) {
        let width = 30 + Math.random() * 30;
        let height = 30 + Math.random() * 30;
        let xPosition = Math.random() * (canvas.width - width);

        // Velocidade dos obstáculos baseada na base + incremento conforme score
        let speedIncrement = Math.floor(score / 120); // Aumenta a cada 120 pontos
        obstacles.push({
            x: xPosition,
            y: -height,
            width: width,
            height: height,
            speed: baseObstacleSpeed + speedIncrement
        });
    }
}

// --- Colisões ---
function checkCollision() {
    for (let obstacle of obstacles) {
        if (
            spaceship.x < obstacle.x + obstacle.width &&
            spaceship.x + spaceship.width > obstacle.x &&
            spaceship.y < obstacle.y + obstacle.height &&
            spaceship.y + spaceship.height > obstacle.y
        ) {
            if (!spaceship.hit) {
                if (lives > 1) {
                    lives--;
                    document.getElementById("lives").textContent = lives;
                    spaceship.hit = true;
                    spaceship.hitTime = Date.now();
                    soundCollision.play();
                } else {
                    gameOver = true;
                    soundGameOver.play();
                }
            }
        }
    }
}

// --- Atualização da pontuação ---
function updateScore() {
    score++;
    document.getElementById("score").textContent = score;

    // Ganha vida a cada 1000 pontos
    if (score % 1000 === 0 && score > 0) {
        lives++;
        document.getElementById("lives").textContent = lives;
        soundLife.play();
    }

    // Aumenta dificuldade (diminui spawnInterval) a cada 120 pontos
    if (score % 120 === 0) {
        spawnInterval = Math.max(300, spawnInterval - 50); // não deixa passar de 300ms
    }
}

// --- Atualização do tempo ---
function updateTime() {
    time++;
    document.getElementById("time").textContent = time;
}

// --- Loop principal ---
function updateGame() {
    if (gameOver) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "red";
        ctx.font = "48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
        ctx.font = "24px Arial";
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 40);
        ctx.fillText("Pressione ESPAÇO para reiniciar", canvas.width / 2, canvas.height / 2 + 80);

        // Atualiza o highScore se bateu recorde
        if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
        }

        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawSpaceship();
    drawObstacles();
    checkCollision();

    if (Date.now() - lastScoreUpdate > 100) {
        updateScore();
        lastScoreUpdate = Date.now();
    }

    if (Date.now() - lastTimeUpdate > 1000) {
        updateTime();
        lastTimeUpdate = Date.now();
    }

    if (Date.now() - lastObstacleTime > spawnInterval) {
        createObstacle();
        lastObstacleTime = Date.now();
    }

    // Movimento suave com aceleração
    if (movingLeft && !movingRight) {
        spaceship.dx -= spaceship.accel;
    } else if (movingRight && !movingLeft) {
        spaceship.dx += spaceship.accel;
    } else {
        spaceship.dx *= spaceship.friction;
        if (Math.abs(spaceship.dx) < 0.2) spaceship.dx = 0;
    }
    // Limita velocidade máxima
    if (spaceship.dx > spaceship.speed) spaceship.dx = spaceship.speed;
    if (spaceship.dx < -spaceship.speed) spaceship.dx = -spaceship.speed;

    spaceship.x += spaceship.dx;
    if (spaceship.x < 0) {
        spaceship.x = 0;
        spaceship.dx = 0;
    }
    if (spaceship.x + spaceship.width > canvas.width) {
        spaceship.x = canvas.width - spaceship.width;
        spaceship.dx = 0;
    }

    requestAnimationFrame(updateGame);
}

// --- Reiniciar jogo ---
function restartGame() {
    score = 0;
    time = 0;
    lives = 1;
    spaceship.x = canvas.width / 2 - 25;
    spaceship.dx = 0;
    spaceship.hit = false;
    gameOver = false;
    obstacles = [];
    spawnInterval = 800;

    document.getElementById("score").textContent = score;
    document.getElementById("time").textContent = time;
    document.getElementById("lives").textContent = lives;

    updateGame();
}

// --- Controle das teclas ---
function moveRight() {
    spaceship.dx = spaceship.speed;
}

function moveLeft() {
    spaceship.dx = -spaceship.speed;
}

function stop() {
    spaceship.dx = 0;
}

window.addEventListener("keydown", (e) => {
    if (!gameOver) {
        if (e.key === "ArrowRight") moveRight();
        if (e.key === "ArrowLeft") moveLeft();
    } else {
        if (e.key === " " || e.key === "Spacebar") {
            restartGame();
        }
    }
});

window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") stop();
});

// --- Inicializa display ---
document.getElementById("lives").textContent = lives;
document.getElementById("score").textContent = score;
document.getElementById("time").textContent = time;

// --- Mostra o recorde salvo no carregamento ---
document.getElementById("highScore").textContent = highScore;

// --- Começa o jogo ---
updateGame();
