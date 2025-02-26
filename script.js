const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Objects
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  angle: 0,
  xv: 0,
  yv: 0,
  thrust: 0.1,
  friction: 0.99,
  turnSpeed: 0.05,
  color: "white",
  isThrusting: false, // track the state of the thrust
};

const asteroids = [];
const bullets = [];
const particles = [];

// Game Settings
const maxShipSpeed = 5;
const bulletSpeed = 5;
const asteroidVerts = 10; //number of vertices in the asteroids
const asteroidJag = 0.4; //how "jagged" they are (0=circle, 1=very jagged)
const asteroidMaxSize = 100;
const asteroidMinSize = 25;
let asteroidCount = 5; //will change with each level
let asteroidSpeed = 1; //will change with each level

// Game State
let score = 0;
let level = 1;
let lives = 4;

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
  asteroids.length = 0; // clear current asteroids
  for (let i = 0; i < asteroidCount; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * canvas.width);
      y = Math.floor(Math.random() * canvas.height);
    } while (distBetweenPoints(ship.x, ship.y, x, y) < asteroidMaxSize * 2 + ship.size)

    asteroids.push(newAsteroid(x, y, Math.ceil(asteroidMaxSize / 2)));
  }
}

// Function to create a new asteroid
function newAsteroid(x, y, size) {
    let asteroid = {
      x: x,
      y: y,
      xv: Math.random() * asteroidSpeed * 2 - asteroidSpeed,
      yv: Math.random() * asteroidSpeed * 2 - asteroidSpeed,
      size: size,
      verts: Math.floor(Math.random() * (asteroidVerts + 1) + asteroidVerts / 2), //random number of vertices in the asteroid.
      offset: [],
      color: "grey",
      health: 3, // number of shots before being destroyed
    };
    // Create the vertex offset array for the asteroid
    for (let i = 0; i < asteroid.verts; i++) {
      asteroid.offset.push(Math.random() * asteroidJag * 2 + 1 - asteroidJag);
    }
    return asteroid;
}

createAsteroids();

// Drawing Functions
function drawShip(ship) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  // Draw Ship
  ctx.strokeStyle = ship.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ship.size, 0);
  ctx.lineTo(-ship.size, -ship.size / 2);
  ctx.lineTo(-ship.size, ship.size / 2);
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = 1;

  // Draw the thrust
  if(ship.isThrusting){
    ctx.fillStyle = "red";
    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(-ship.size, 0);
    ctx.lineTo(-ship.size*2, -ship.size / 2);
    ctx.lineTo(-ship.size*2, ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawAsteroid(asteroid) {
    ctx.strokeStyle = asteroid.color;
    ctx.lineWidth = 2;
    // Get the first vertex in the asteroid
    ctx.beginPath();
    ctx.moveTo(asteroid.x + asteroid.size * asteroid.offset[0] * Math.cos(0), asteroid.y + asteroid.size * asteroid.offset[0] * Math.sin(0));
    // Draw the polygon for each vertice in the asteroid
    for (let j = 1; j < asteroid.verts; j++) {
      ctx.lineTo(asteroid.x + asteroid.size * asteroid.offset[j] * Math.cos(j * Math.PI * 2 / asteroid.verts), asteroid.y + asteroid.size * asteroid.offset[j] * Math.sin(j * Math.PI * 2 / asteroid.verts));
    }
    //close the shape
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 1;
}

function drawBullet(bullet) {
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'yellow';
  ctx.fill();
}

function drawParticle(p){
    ctx.fillStyle = "white";
    ctx.fillRect(p.x,p.y,p.size,p.size)
}

function drawGameText(){
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 10, 30);
    ctx.fillText("Lives: " + lives, 10, 60);
    ctx.fillText("Level: " + level, 10, 90);
}

// Update Functions
function updateShip() {
  // Thrust
  ship.isThrusting = false; //set thrusting as false
  if (keys.up) {
    ship.isThrusting = true;
    ship.xv += ship.thrust * Math.cos(ship.angle);
    ship.yv += ship.thrust * Math.sin(ship.angle);
  }
    if (keys.down) {
    ship.isThrusting = true;
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

function updateParticles(){
    if (ship.isThrusting){
        particles.push({
            x: ship.x - (Math.cos(ship.angle) * ship.size),
            y: ship.y - (Math.sin(ship.angle) * ship.size),
            xv: Math.random() -0.5 + ship.xv * 0.1,
            yv: Math.random() -0.5 + ship.yv * 0.1,
            size: Math.random() * 4 + 2,
            life: Math.random() * 5 + 5,
        })
    }
    particles.forEach((p,index)=>{
        p.x += p.xv;
        p.y += p.yv;
        p.life--;
        if(p.life <= 0){
            particles.splice(index, 1);
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
      // Decrease lives
      lives--;
      // Reset the ship if lives are available
      if(lives > 0){
        ship.x = canvas.width / 2;
        ship.y = canvas.height / 2;
        ship.xv = 0;
        ship.yv = 0;
      }
    }
    for (let b = 0; b < bullets.length; b++) {
      const bullet = bullets[b];
      const bdx = bullet.x - asteroid.x;
      const bdy = bullet.y - asteroid.y;
      const bdistance = Math.sqrt(bdx * bdx + bdy * bdy);
      if (bdistance < asteroid.size) {
        bullets.splice(b, 1);

        // Decrease asteroid health
        asteroid.health--;
        if(asteroid.health <= 0){
            // Increase score based on asteroid size
            score += Math.round(asteroidMaxSize / asteroid.size) * 10;
            // Split the asteroid if it's large enough
            if (asteroid.size > asteroidMinSize) {
              asteroids.push(newAsteroid(asteroid.x, asteroid.y, Math.ceil(asteroid.size / 2)));
              asteroids.push(newAsteroid(asteroid.x, asteroid.y, Math.ceil(asteroid.size / 2)));
            }
            asteroids.splice(i, 1);
            i--; // Decrement i to account for removed asteroid
        }

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

// Distance between two points
function distBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Reset game
function resetGame() {
    score = 0;
    level = 1;
    lives = 4;
    asteroidCount = 5;
    asteroidSpeed = 1;
    createAsteroids();
    ship.x = canvas.width / 2;
    ship.y = canvas.height / 2;
    ship.xv = 0;
    ship.yv = 0;
}

// Game Loop
function gameLoop() {
  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

    if(lives > 0){
        // Update Game Objects
        updateShip();
        updateAsteroids();
        updateBullets();
        updateParticles();
        checkCollisions();

        // Draw Game Objects
        drawShip(ship);
        asteroids.forEach(drawAsteroid);
        bullets.forEach(drawBullet);
        particles.forEach(drawParticle);
        drawGameText();

        //Check if the level should be changed
        if(asteroids.length == 0){
            level++;
            asteroidCount = level * 5;
            asteroidSpeed = level;
            createAsteroids();
        }
    }else{
        ctx.font = "50px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2);
        ctx.fillText("Score: "+score, canvas.width/2, canvas.height/2 + 50);
        //Restarts the game when hit the space key
        if(keys.space){
            resetGame();
        }
    }

  requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
