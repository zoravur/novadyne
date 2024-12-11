class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.time = 0;
    this.baseRadius = 12;
    this.minScale = 0.05;
    this.maxScale = 1;
    this.completed = false;
  }
  
  step() {
    if (this.completed) return;
    this.time += 0.12;
    if (this.time >= 2 * Math.PI) {
      this.completed = true;
    }
  }
  
  draw(ctx) {
    if (this.completed) return;
    
    ctx.save();
    ctx.translate(this.x, this.y);
    
    const offsetTime = this.time - Math.PI / 2;
    const sineValue = Math.sin(offsetTime);
    const scale = this.minScale + (sineValue + 1) * (this.maxScale - this.minScale) / 2;
    const currentRadius = this.baseRadius * scale;
    
    const colorMix = (-Math.cos(offsetTime/1.5) + 1) / 2;
    const currentHue = 60 - (colorMix * 60);
    
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x = currentRadius * Math.cos(angle);
      const y = currentRadius * Math.sin(angle);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.quadraticCurveTo(0, 0, x, y);
      }
    }
    ctx.quadraticCurveTo(0, 0, currentRadius, 0);
    
    ctx.fillStyle = `hsl(${currentHue}, 100%, 50%)`;
    ctx.fill();
    
    ctx.restore();
  }
  
  isCompleted() {
    return this.completed;
  }
}

/// EXAMPLE USAGE
// const canvas = document.getElementById('canvas');
// const ctx = canvas.getContext('2d');

// // Array to store active explosions
// let explosions = [];
// 
// // Click handler
// canvas.addEventListener('click', (e) => {
//   const rect = canvas.getBoundingClientRect();
//   const x = e.clientX - rect.left;
//   const y = e.clientY - rect.top;
//   explosions.push(new Explosion(x, y));
// });
// 
// // Animation loop
// function render() {
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   
//   // Step and draw each explosion
//   for (const explosion of explosions) {
//     explosion.step();
//     explosion.draw(ctx);
//   }
//   
//   // Remove completed explosions
//   explosions = explosions.filter(exp => !exp.isCompleted());
//   
//   requestAnimationFrame(render);
// }
// 
// // Start animation loop
// render(); 






//// UTIL FUNCTIONS /////////

function createSeededRandom(seed) {
  let state = seed;
  return function () {
    // LCG constants
    state = (state * 1664525 + 1013904223) % 4294967296;
    return (state >>> 0) / 4294967296; // Convert to a [0, 1) float
  };
}

function normalizeVec(x, y) {
  const d = Math.sqrt(x*x + y*y);
  return {x: x/d, y: y/d};
}

function fastSoftmaxSample(arr) {
  const minVal = Math.min(...arr);
  const maxVal = Math.max(...arr);

  // normalize to [0, 1]
  const normalized = arr.map(v => (v - minVal) / (maxVal - minVal));
  const sum = normalized.reduce((acc, v) => acc + v, 0);
  const probabilities = normalized.map(v => v / sum); // normalize to sum to 1

  // sample an index based on the probabilities
  const random = Math.random();
  let cumulative = 0;

  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (random < cumulative) {
      return i; // return the index
    }
  }

  return probabilities.length - 1; // fallback in case of rounding errors
}

function randomColor(randomFunc) {
  return `hsl(${randomFunc() * 360}, 65%, 55%)`;
}
const planetRandom = createSeededRandom(1);
const level1 = {
  planets: [{
    x: 500,
    y: 300,
    team: 'BLUE',
    size: 40,
    color: randomColor(planetRandom),
  }, {
    x: 700,
    y: 650,
    team: 'RED',
    size: 30,
    color: randomColor(planetRandom),
  }],
  ships: []
};

//////////// CONSTANTS ///////////////
const FRAMERATE = 60; // DO NOT MODIFY
const SHIP_SPEED = 1;
const SIM_FACTOR = 2;
const NUM_PLANETS = 5;
const WORLD_SEED = 7;
const COMBAT_RATE = 20;
const BASE_PRODUCTION_RATE = 2;

// seeds i like: [6, 7, 8, 9]
// Example usage
const seededRandom = createSeededRandom(42); // Replace 12345 with your seed

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// set canvas to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// track planets and ships
const planets = level1.planets;
let ships = level1.ships;
let hoveredPlanet = null;
let selectedPlanets = [];
let explosions = [];


const teamColorMap = {
  BLUE: `hsl(${0.55 * 360}, 80%, 60%)`,
  RED: `hsl(${0.05 * 360}, 80%, 60%)`,
};

// create some random planets
// let blueMass = 0;
// let redMass = 0;
// for (let i = 0; i < NUM_PLANETS; i++) {
//   //const team = seededRandom() < blueMass / (blueMass + redMass) ? 'BLUE' : 'RED',
//   planets.push({
//     x: seededRandom() * canvas.width,
//     y: seededRandom() * canvas.height,
//     team: seededRandom() < 0.5 ? 'BLUE' : 'RED',
//     size: Math.floor(seededRandom() * 70) + 20,
//     color: `hsl(${seededRandom() * 360}, 70%, 50%)`
//   });
// }

function findClosestPlanet(w, z) {
  const distances = planets.map(({x, y}) => (x - w)*(x-w) + (y-z)*(y-z));
  let min = Math.min(...distances);
  let idx = distances.findIndex(dist => dist == min);
  return {planet: planets[idx], distance: min, idx };
}

function computeSquaredDistance(entity1, entity2) {
  const {x, y} = entity1;
  const {x: w, y: z} = entity2;
  return (x-w)*(x-w) + (y-z)*(y-z);
}

function reassignFraction(pIdx1, pIdx2, frac = 0.6) {
  const totalAt1 = ships.filter(({planetIdx, orbiting}) => planetIdx === pIdx1 && orbiting).length;
  
  let counter = 0;
  ships.forEach(ship => {
    if (ship.planetIdx === pIdx1 && ship.orbiting && counter < totalAt1 * frac) {
      ship.planetIdx = pIdx2;
      counter += 1;
    }
  });
}

let tickCount = 0;
// main game loop
function update() {
  tickCount += SIM_FACTOR;
  
  if (tickCount % 60 === 0) {
    const idx1 = Math.floor(seededRandom() * planets.length);
    let idx2 = idx1;
    
    while (idx2 == idx1) {
      idx2 = Math.floor(seededRandom() * planets.length);
    }

    if (jumping) reassignFraction(idx1, idx2);
  }


  /// ship movement -- this code is super janky
  ships.forEach(ship => {
    //const {planet: closestPlanet, distance: d, idx} = findClosestPlanet(ship.x, ship.y);
    const shipPlanet = planets[ship.planetIdx];
    const d = computeSquaredDistance(shipPlanet, ship);

    if (d * 0.81 < (shipPlanet.size)*(shipPlanet.size)*ship.orbitRadius) {
      ship.orbiting = true;
    } else {
      ship.orbiting = false;
    }

    let {x: dx, y: dy} = normalizeVec(shipPlanet.x - ship.x, shipPlanet.y - ship.y)

    ship.dx = dx;
    ship.dy = dy;


    let altitudeDelta = (shipPlanet.size)*(shipPlanet.size) * ship.orbitRadius - (d * 0.9)
    
    if (ship.orbiting) {
      ship.x += (-(0.001*altitudeDelta*ship.dx) + ship.dy) * SIM_FACTOR;
      ship.y += (-(0.001*altitudeDelta*ship.dy) - ship.dx) * SIM_FACTOR;
    } else {
      ship.x += ship.dx * SIM_FACTOR;
      ship.y += ship.dy * SIM_FACTOR;
    }
  });

  /////////////////// model combat and generation ///////////////////////////
  if (tickCount % 20 === 0) {
    //////////// compute statistics //////////////////
    let totalPerTeam = Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0]))
    let teamCapacities = planets.reduce((acc, planet) => { 
      acc[planet.team] = (acc[planet.team] || 0) + planet.size; 
      return acc; 
    }, {});

    let buckets = Array.from({length: planets.length}, (_, idx) => ({  ships: [], counts: {} }));
    ships.forEach((ship, shipIdx) => {
      if (ship.orbiting) {
        buckets[ship.planetIdx].ships.push(shipIdx);
        buckets[ship.planetIdx].counts[ship.team] = buckets[ship.planetIdx].counts[ship.team] + 1 || 1;
      }
      totalPerTeam[ship.team] = totalPerTeam[ship.team] + 1 || 1;
    });


    ////////////// update ///////////////////////////
    let newShips = [...ships];
    buckets.forEach((bucket, planetIdx) => {
      /// combat ////
      const x = bucket.ships.length;
      const teams = Object.keys(bucket.counts);
      actionProb = x > 0 ? Math.exp((x - 30)/30) / (1 + Math.exp((x-30)/ 30)) : 0;
      if (seededRandom() < actionProb) {
        const hitter = fastSoftmaxSample(teams.map(t => bucket.counts[t]));
        teams.splice(hitter, 1);
        const hittee = fastSoftmaxSample(teams.map(t => bucket.counts[t]));
        
        //console.log('hittee ===', hittee);
        const selectedTeam = teams[hittee];
        for (let i = bucket.ships.length-1; i >= 0; --i) {
          let shipIdx = bucket.ships[i];
          if (ships[shipIdx].team === selectedTeam && ships[shipIdx].orbiting) {
            newShips.splice(shipIdx, 1);
            explosions.push(new Explosion(ships[shipIdx].x, ships[shipIdx].y));
            break;
          }
        }
      }

      /// allegiance switching ///
      teams.forEach(t => {
        if (bucket.counts[t] === bucket.ships.length) {
          // planet planetIdx is occupied solely by team t
          planets[planetIdx].team = t;
        }
      });

      /// production / generation
      // generation is constant
      if (totalPerTeam[planets[planetIdx].team] < teamCapacities[planets[planetIdx].team]) {
        // if we are over capacity, do not produce
        const productionRate = planets[planetIdx].size;
        const baseRate = Math.floor(500 / BASE_PRODUCTION_RATE);
        //console.log('generation');
        //console.log(tickCount / 20, Math.floor(baseRate / productionRate));
        if ((tickCount / 20) % (Math.ceil(baseRate / productionRate)+1) === 0) {

          if (planetIdx === 0) {
            console.log(totalPerTeam, teamCapacities);
          }
          const orbitRadius = 1 / (seededRandom() * 0.5 + 0.3);
          newShips.push({ 
            x: planets[planetIdx].x,
            y: planets[planetIdx].y + planets[planetIdx].size * Math.sqrt(orbitRadius),
            orbitRadius,
            orbiting: true,
            team: planets[planetIdx].team,
            color: teamColorMap[planets[planetIdx].team],
            planetIdx,
          });
        }
      }
    });
    ships = newShips;
  }



  //////////////////////// RENDERING /////////////////////////////
  function drawShip(ctx, x, y, dx, dy, fill) {
    const shipLength = 12; // length of the ship (long side)
    const shipWidth = 8;  // width of the kite (short side)
    const eccentricity = 0.6;

    // calculate perpendicular direction for the ship's width
    const perpX = -dy;
    const perpY = dx;

    // calculate points of the kite
    const frontX = x + dx * shipLength; // front point
    const backX = x - dx * shipLength * 0.5; // back point
    const backLeftX = (backX * eccentricity + frontX * (1-eccentricity)) + perpX * shipWidth * 0.5; // left point of the back
    const backRightX = (backX * eccentricity + frontX * (1-eccentricity)) - perpX * shipWidth * 0.5; // right point of the back

    const frontY = y + dy * shipLength;
    const backY = y - dy * shipLength * 0.5;
    const backLeftY = (backY * eccentricity + frontY * (1-eccentricity)) + perpY * shipWidth * 0.5;
    const backRightY = (backY * eccentricity + frontY * (1-eccentricity)) - perpY * shipWidth * 0.5;

    // draw the kite
    ctx.beginPath();
    ctx.moveTo(frontX, frontY); // front point
    ctx.lineTo(backLeftX, backLeftY); // back-left
    ctx.lineTo(backX, backY); // back-center
    ctx.lineTo(backRightX, backRightY); // back-right
    ctx.closePath();

    // fill and stroke the kite
    ctx.fillStyle = fill;
    //ctx.strokeStyle = "black";
    ctx.lineWidth = 1;
    ctx.fill();
    //ctx.stroke();
  }

  // redraw everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // draw planets; two passes so that highlighting is never on top of planet
  planets.forEach((planet, idx) => {
    if (hoveredPlanet === idx) {
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.size+10, 0, Math.PI * 2);
      ctx.fillStyle = "#aaa9";
      ctx.fill();
      ctx.closePath();

    }
    if (selectedPlanets.includes(idx)) {
      ctx.beginPath();
      ctx.arc(planet.x, planet.y, planet.size+10, 0, Math.PI * 2);
      ctx.fillStyle = "#aaa";
      ctx.fill();
      ctx.closePath();

      ctx.beginPath();
      ctx.moveTo(planet.x, planet.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.strokeStyle = "#aaa";
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#aaa";
      ctx.fill();
      ctx.closePath();
    }
  });
  planets.forEach((planet, idx) => {
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
    ctx.fillStyle = planet.color;
    ctx.fill();
    ctx.closePath();


    // draw the carrying capacity (planet size) at the center
    ctx.font = "20px Arial"; // set font size and style
    ctx.textAlign = "center"; // center text horizontally
    ctx.textBaseline = "middle"; // center text vertically
    ctx.fillStyle = teamColorMap[planet.team]; // text color
    ctx.strokeStyle = "black"; // outline color
    ctx.lineWidth = 2; // outline thickness

    // https://stackoverflow.com/a/63239887/8421788
    const fix = ctx.measureText("H").actualBoundingBoxDescent / 2; // Notice Here

    // draw outline first for contrast
    ctx.strokeText(Math.floor(planet.size), planet.x, planet.y + fix);

    // draw the text
    ctx.fillText(Math.floor(planet.size), planet.x, planet.y + fix);
  });

  // draw ships
  ships.forEach(ship => {
    if (ship.orbiting) {
      drawShip(ctx, ship.x, ship.y, ship.dy, -ship.dx, ship.color);
    } else {
      drawShip(ctx, ship.x, ship.y, ship.dx, ship.dy, ship.color);
    }
    // ctx.beginPath();
    // ctx.arc(ship.x, ship.y, 5, 0, Math.PI * 2);
    // ctx.fillStyle = ship.color;
    // ctx.fill();
    // ctx.closePath();
  });


  // Step and draw each explosion
  for (const explosion of explosions) {
    explosion.step();
    explosion.draw(ctx);
  }
  
  // Remove completed explosions
  explosions = explosions.filter(exp => !exp.isCompleted());
  
  if (paused === true) return;
  requestAnimationFrame(update);
}

// add a ship on click
canvas.addEventListener('click', e => {
  let [x, y] = [e.clientX, e.clientY];

  if (e.ctrlKey) {
    ships.push({ x, y, 
      orbitRadius: 1 / (seededRandom() * 0.5 + 0.3),
      orbiting: false,
      team: e.shiftKey ? 'RED' : 'BLUE',
      color: e.shiftKey ? `hsl(${0.05 * 360}, 80%, 60%)` : `hsl(${0.55 * 360}, 80%, 60%)`, 
      planetIdx: findClosestPlanet(x,y).idx
    });

    console.log('adding ship');
  }
});

let isMouseDown = false;
let mouseX = null;
let mouseY = null;
canvas.addEventListener('mousedown', () => {
  isMouseDown = true;
});

canvas.addEventListener('mouseup', () => {
  // console.log(hoveredPlanet);
  if (hoveredPlanet !== null) {
    selectedPlanets.forEach((planetIdx) => { // this is getting confusing, but selectedPlanets stores indices itself
      //console.log(planetIdx, hoveredPlanet);
      reassignFraction(planetIdx, hoveredPlanet);
    });
  } else {
    selectedPlanets.length = 0;

  }

  isMouseDown = false;
});

canvas.addEventListener('mousemove', e=>{
  let [x, y] = [e.clientX, e.clientY];
  [mouseX, mouseY] = [x, y];
  
  const {planet, distance: d, idx} = findClosestPlanet(x, y);
  //console.log(planet, d);
  
  if (planet.size*planet.size > d) {
    hoveredPlanet = idx;
  } else {
    hoveredPlanet = null;
  }

  if (planet.size*planet.size > d && isMouseDown) {
    if (!selectedPlanets.includes(idx)) {
      selectedPlanets.push(idx);
    }
  } else if (planet.size*planet.size > d && !isMouseDown) {
  } else if (!isMouseDown) {
    selectedPlanets.length = 0;
    // let i = selectedPlanets.indexOf(idx);
    // if (i !== -1) {
    //   selectedPlanets.splice(i, 1);
    // }
  } 
});

let paused = false;
document.getElementById('pauseButton').addEventListener('click', e => {
  paused = !paused;
  e.target.innerHTML = paused ? 'play' : 'pause';
  if (!paused) {
    update();
  }
});

let jumping = false;
document.getElementById('jumpToggleButton').addEventListener('click', e => {
  jumping = !jumping;
});

update(); // start loop
