const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Objects
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  angle: 0,
  xv: 0, // x velocity
  yv: 0, // y velocity
  thrust: 0.1,
  friction: 0.99, // to slow down over time
  turnSpeed: 0.05,
  color: "white",
};

const asteroids = [];
const bullets = [];

// Game Settings
const asteroidCount = 5;
const asteroidSize = 50;
const bulletSpeed = 5;
const maxAsteroidsSpeed = 1;
const maxShipSpeed = 5;

// Controls
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false,
};

// Create Asteroids
function createAsteroids() {
  for (let i = 0; i < asteroidCount; i++) {
    asteroids.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: asteroidSize,
      xv: Math.random() * 2 - 1,
      yv: Math.random() * 2 - 1,
      color: "grey"
    });
  }
}
createAsteroids();

// Drawing Functions
function drawShip(ship) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  ctx.beginPath();
  ctx.moveTo(ship.size, 0);
  ctx.lineTo(-ship.size, -ship.size / 2);
  ctx.lineTo(-ship.size, ship.size / 2);
  ctx.closePath();

  ctx.strokeStyle = ship.color;
  ctx.stroke();
  ctx.restore();
}

function drawAsteroid(asteroid) {
  ctx.beginPath();
  ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
  ctx.strokeStyle = asteroid.color;
  ctx.stroke();
}

function drawBullet(bullet) {
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
}

// Update Functions
function updateShip() {
  // Thrust
  if (keys.up) {
    ship.xv += ship.thrust * Math.cos(ship.angle);
    ship.yv += ship.thrust * Math.sin(ship.angle);
  }
    if (keys.down) {
    ship.xv -= ship.thrust * Math.cos(ship.angle);
    ship.yv -= ship.thrust * Math.sin(ship.angle);
  }

  // Apply friction
  ship.xv *= ship.friction;
  ship.yv *= ship.friction;

  // Limit speed
  let speed = Math.sqrt(ship.xv * ship.xv + ship.yv * ship.yv);
  if (speed > maxShipSpeed) {
    ship.xv *= maxShipSpeed / speed;
    ship.yv *= maxShipSpeed / speed;
  }

  // Turning
  if (keys.left) {
    ship.angle -= ship.turnSpeed;
  }
  if (keys.right) {
    ship.angle += ship.turnSpeed;
  }

  //Fire
  if (keys.space) {
    fireBullet();
    keys.space = false;
  }

  // Update position based on velocity
  ship.x += ship.xv;
  ship.y += ship.yv;

  // Screen Wrap
  if (ship.x < 0) ship.x = canvas.width;
  if (ship.x > canvas.width) ship.x = 0;
  if (ship.y < 0) ship.y = canvas.height;
  if (ship.y > canvas.height) ship.y = 0;
}

function updateAsteroids() {
  asteroids.forEach(asteroid => {
    asteroid.x += asteroid.xv;
    asteroid.y += asteroid.yv;

    if (asteroid.x < 0) asteroid.x = canvas.width;
    if (asteroid.x > canvas.width) asteroid.x = 0;
    if (asteroid.y < 0) asteroid.y = canvas.height;
    if (asteroid.y > canvas.height) asteroid.y = 0;
  });
}

function updateBullets() {
  bullets.forEach((bullet, index) => {
    bullet.x += bullet.xv;
    bullet.y += bullet.yv;
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(index, 1);
    }
  });
}

function fireBullet() {
  bullets.push({
    x: ship.x + ship.size * Math.cos(ship.angle),
    y: ship.y + ship.size * Math.sin(ship.angle),
    xv: bulletSpeed * Math.cos(ship.angle),
    yv: bulletSpeed * Math.sin(ship.angle),
  })
}

// Collision Detection
function checkCollisions() {
  for (let i = 0; i < asteroids.length; i++) {
    const asteroid = asteroids[i];
    const dx = ship.x - asteroid.x;
    const dy = ship.y - asteroid.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ship.size + asteroid.size) {
      // Collision with ship
      // console.log("Colision ship")
      // For now, we'll just reset the ship's position.
      ship.x = canvas.width / 2;
      ship.y = canvas.height / 2;
      ship.xv = 0;
      ship.yv = 0;
    }
    for (let b = 0; b < bullets.length; b++) {
      const bullet = bullets[b];
      const bdx = bullet.x - asteroid.x;
      const bdy = bullet.y - asteroid.y;
      const bdistance = Math.sqrt(bdx * bdx + bdy * bdy);
      if (bdistance < asteroid.size) {
        //console.log("colision bullet")
        bullets.splice(b, 1);
        asteroids.splice(i, 1);
      }
    }
  }
}

// Keyboard Handling
document.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      keys.up = true;
      break;
      case 'ArrowDown':
        keys.down = true;
        break;
    case 'ArrowLeft':
      keys.left = true;
      break;
    case 'ArrowRight':
      keys.right = true;
      break;
    case ' ':
      keys.space = true;
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'ArrowUp':
      keys.up = false;
      break;
    case 'ArrowDown':
      keys.down = false;
      break;
    case 'ArrowLeft':
      keys.left = false;
      break;
    case 'ArrowRight':
      keys.right = false;
      break;
    case ' ':
      keys.space = false;
      break;
  }
});

// Game Loop
function gameLoop() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update Game Objects
  updateShip();
  updateAsteroids();
  updateBullets();
  checkCollisions();

  // Draw Game Objects
  drawShip(ship);
  asteroids.forEach(drawAsteroid);
  bullets.forEach(drawBullet);

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
