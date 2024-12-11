function createSeededRandom(seed) {
  let state = seed;
  return function () {
    // LCG constants
    state = (state * 1664525 + 1013904223) % 4294967296;
    return (state >>> 0) / 4294967296; // Convert to a [0, 1) float
  };
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

// seeds i like: [6, 7, 8]
// Example usage
const seededRandom = createSeededRandom(8); // Replace 12345 with your seed

console.log(seededRandom()); // 0.7264370312694905
console.log(seededRandom()); // 0.007252081293612719
console.log(seededRandom()); // 0.5690911164673567

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// set canvas to fill the screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// track planets and ships
const planets = [];
let ships = [];
let selectedPlanet = null;
let targetPlanet = null;

// create some random planets
for (let i = 0; i < 5; i++) {
  planets.push({
    x: seededRandom() * canvas.width,
    y: seededRandom() * canvas.height,
    size: seededRandom() * 30 + 20,
    color: `hsl(${seededRandom() * 360}, 70%, 50%)`
  });
}

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
  tickCount += 1;
  
  if (tickCount % 60 === 0) {
    const idx1 = Math.floor(seededRandom() * planets.length);
    let idx2 = idx1;
    
    while (idx2 == idx1) {
      idx2 = Math.floor(seededRandom() * planets.length);
    }

    if (jumping) reassignFraction(idx1, idx2);
  }


  // move ship towards its closest planet
  ships.forEach(ship => {
    //const {planet: closestPlanet, distance: d, idx} = findClosestPlanet(ship.x, ship.y);
    const shipPlanet = planets[ship.planetIdx];
    const d = computeSquaredDistance(shipPlanet, ship);

    if (d * ship.orbitRadius * 0.81 < (shipPlanet.size)*(shipPlanet.size)) {
      ship.orbiting = true;
    } else {
      ship.orbiting = false;
    }

    if (d * ship.orbitRadius < (shipPlanet.size)*(shipPlanet.size)) {
      ship.y += -(shipPlanet.x - ship.x) * 0.003;
      ship.x += (shipPlanet.y - ship.y) * 0.003;
    } else {
      ship.x += (shipPlanet.x - ship.x) * 0.003;
      ship.y += (shipPlanet.y - ship.y) * 0.003;
    }
  });

  /////////////////// model combat ///////////////////////////
  if (tickCount % 20 === 0) {
    let buckets = Array.from({length: planets.length}, () => ({ ships: [], counts: {} }));
    ships.forEach((ship, shipIdx) => {
      if (ship.orbiting) {
        buckets[ship.planetIdx].ships.push(shipIdx);
        buckets[ship.planetIdx].counts[ship.team] = buckets[ship.planetIdx].counts[ship.team] + 1 || 1;
      }
    });
    let newShips = [...ships];
    buckets.forEach(bucket => {
      //const fps = 60;
      //const no_op = fps;
      //console.log(JSON.stringify({['counts']: bucket.counts, 'ships.length': bucket.ships.length}, 0, 2));
      //const action = fastSoftmaxSample(teams.map(t => bucket.counts[t]).concat([no_op]));
      //

      const teams = Object.keys(bucket.counts);
      const x = bucket.ships.length;
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
            break;
          }
        }
      }
    });
    ships = newShips;
  }

  // redraw everything
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#333";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // draw planets; two passes so that highlighting is never on top of planet
  planets.forEach((planet, idx) => {
    if (idx === selectedPlanet || idx === targetPlanet) {
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
  });

  // draw ships
  ships.forEach(ship => {
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = ship.color;
    ctx.fill();
    ctx.closePath();
  });


  if (paused === true) return;
  requestAnimationFrame(update);
}

// add a ship on click
canvas.addEventListener('click', e => {
  let [x, y] = [e.clientX, e.clientY];
  ships.push({ x, y, 
    orbitRadius: seededRandom() * 0.5 + 0.3,
    orbiting: false,
    team: e.shiftKey ? 'RED' : 'BLUE',
    color: e.shiftKey ? `hsl(${0.05 * 360}, 80%, 60%)` : `hsl(${0.55 * 360}, 80%, 60%)`, 
    planetIdx: findClosestPlanet(x,y).idx
  });

  console.log('adding ship');
});


let isMouseDown = false;
let mouseX = null;
let mouseY = null;
canvas.addEventListener('mousedown', () => {
  isMouseDown = true;
});

canvas.addEventListener('mouseup', () => {
  isMouseDown = false;
});

canvas.addEventListener('mousemove', e=>{
  let [x, y] = [e.clientX, e.clientY];
  [mouseX, mouseY] = [x, y];
  
  const {planet, distance: d, idx} = findClosestPlanet(x, y);
  //console.log(planet, d);
  if (planet.size*planet.size > d) {
    if (isMouseDown) {
      targetPlanet = idx;
    } else {
      selectedPlanet = idx;
    }
    console.log(selectedPlanet);
  } else {
    if (!isMouseDown) {
      selectedPlanet = null;
      targetPlanet = null;
    }
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
