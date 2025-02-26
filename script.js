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
  isExploding: false,
  timeToSpawn:0,
  fireCooldown: 0, // Cooldown for firing
};

const alienShip = {
    x: 0,
    y: 0,
    size: 30,
    xv: 0,
    yv: 0,
    fireCooldown: 0,
};

const asteroids = [];
const bullets = [];
const alienBullets = [];
const particles = [];

// Game Settings
const maxShipSpeed = 5;
const bulletSpeed = 5;
const bulletMaxFireRate = 0.25; // 4 shots per second
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
let gameOver = false;

// Controls
const keys = {
  up: false,
  down: false,
  left: false,
  right: false,
  space: false,
  r: false,
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

function drawAlienBullet(bullet) {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
}

function drawParticle(p){
    ctx.fillStyle = p.color;
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

function drawAlienShip(alienShip){
    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(alienShip.x, alienShip.y);
    ctx.lineTo(alienShip.x + alienShip.size, alienShip.y + alienShip.size);
    ctx.lineTo(alienShip.x + alienShip.size, alienShip.y - alienShip.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Update Functions
function updateShip() {
    // Update the time to spawn the ship after an explosion
    if(ship.timeToSpawn > 0){
        ship.timeToSpawn--;
    }

    if(ship.fireCooldown > 0){
        ship.fireCooldown--;
    }

    if(!ship.isExploding && ship.timeToSpawn == 0){
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
      if (keys.space && ship.fireCooldown <= 0) {
        fireBullet();
        ship.fireCooldown = bulletMaxFireRate * 60;
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

function updateAlienShip(){
    if(level >= 3 && asteroids.length > 0){ //only active if level is 3 or greater
        if(alienShip.x == 0 && alienShip.y == 0 && alienShip.xv == 0 && alienShip.yv == 0){
            //set the initial position for the ship and the direction of fly
            let rand = Math.random();
            if(rand < 0.25){
                alienShip.x = 0 - alienShip.size;
                alienShip.y = Math.random() * canvas.height;
                alienShip.xv = Math.random() * 0.5 + 1;
                alienShip.yv = 0;
            }else if(rand < 0.5){
                alienShip.x = canvas.width + alienShip.size;
                alienShip.y = Math.random() * canvas.height;
                alienShip.xv = Math.random() * -0.5 -1;
                alienShip.yv = 0;
            }else if(rand < 0.75){
                alienShip.x = Math.random() * canvas.width;
                alienShip.y = 0 - alienShip.size;
                alienShip.xv = 0;
                alienShip.yv = Math.random() * 0.5 + 1;
            }else{
                alienShip.x = Math.random() * canvas.width;
                alienShip.y = canvas.height + alienShip.size;
                alienShip.xv = 0;
                alienShip.yv = Math.random() * -0.5 - 1;
            }
        }

        //move the ship
        alienShip.x += alienShip.xv;
        alienShip.y += alienShip.yv;

        //remove alien ship out of bound
        if(alienShip.x < 0 - alienShip.size || alienShip.x > canvas.width + alienShip.size || alienShip.y < 0 - alienShip.size || alienShip.y > canvas.height + alienShip.size){
            alienShip.x = 0;
            alienShip.y = 0;
            alienShip.xv = 0;
            alienShip.yv = 0;
        }

        //fire the alien bullet
        if(alienShip.fireCooldown <= 0){
            alienFireBullet(alienShip);
            alienShip.fireCooldown = 2 * 60;
        }else{
            alienShip.fireCooldown--;
        }

    }else{
        alienShip.x = 0;
        alienShip.y = 0;
        alienShip.xv = 0;
        alienShip.yv = 0;
    }
}

function updateAlienBullets(){
    alienBullets.forEach((bullet, index) => {
        bullet.x += bullet.xv;
        bullet.y += bullet.yv;
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            alienBullets.splice(index, 1);
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
            color:"yellow",
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
