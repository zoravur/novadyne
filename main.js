"use strict";

import {
  FRAMERATE,
  SHIP_SPEED,
  SIM_FACTOR,
  NUM_PLANETS,
  WORLD_SEED,
  COMBAT_RATE,
  BASE_PRODUCTION_RATE,
  BASE_TERRAFORMING_RATE,
  LEVEL_NUM,
  teamColorMap,
} from "./constants.js";

import { Explosion, drawTerraforming, drawShip, render } from "./graphics.js";
import { levels, setRandomLevel } from "./levels.js";
import {
  createSeededRandom,
  normalizeVec,
  fastSoftmaxSample,
  randomColor,
  planetRandom,
  computeSquaredDistance,
} from "./util.js";
import { buildUi } from './ui.js';
import { RandomAI, GreedyAI, MixedAI, CleverAI, DefensiveAI, NullAI } from "./ai.js";
import { GameStatistics } from './gameStatistics.js';

// seeds i like: [6, 7, 8, 9]
// Example usage
const seededRandom = createSeededRandom(42); // Replace 12345 with your seed

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// set canvas to fill the screen
canvas.width = 1800;
canvas.height = 1300;

// track planets and ships
const globalGameState = {
  planets: levels[LEVEL_NUM-1].planets,
  ships: levels[LEVEL_NUM-1].ships,
  tickCount: 0,
  gameResult: null,
}

let hoveredPlanet = null;
let selectedPlanets = [];
let explosions = [];

const preferences = {
  paused: false,
  jumping: true,
  drawDebug: false,
};

function selectLevel(lvlNum) {
  globalGameState.planets = levels[lvlNum-1].planets;
  globalGameState.ships = levels[lvlNum-1].ships;
  globalGameState.tickCount = 0;
  globalGameState.gameResult = null;
}

buildUi(preferences, selectLevel, update, seed => setRandomLevel(seed, globalGameState));

const gameStats = new GameStatistics(globalGameState);

// let opponent = new GreedyAI(globalGameState, 'RED');
// let opponentGreen = new GreedyAI(globalGameState, 'YELLOW');

let opponents = Object.keys(teamColorMap)
  //.filter(team => team !== 'BLUE')
  .map(team => team === 'BLUE' ? new NullAI(globalGameState, team, gameStats) : new CleverAI(globalGameState, team, gameStats));

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



function reassignFraction(pIdx1, pIdx2, team, frac = 0.6) {
  const {ships, planets} = globalGameState;
  
  const totalAt1 = ships.filter(({planetIdx, orbiting, team: shipTeam}) => 
    planetIdx === pIdx1 && orbiting && shipTeam===team).length;
  
  let counter = 0;
  ships.forEach(ship => {
    if (ship.planetIdx === pIdx1 && ship.orbiting && ship.team === team && counter < totalAt1 * frac) {
      ship.planetIdx = pIdx2;
      counter += 1;
    }
  });
}

let lastUpdateTime = Date.now();
let accumTime = 0;

// Fix the timestep at updates per second
const MS_PER_FRAME = 1000 / 120;

// main game loop
function update() {
  const { planets, ships } = globalGameState;

  const curTime = Date.now();
  const dt = curTime - lastUpdateTime;
  lastUpdateTime = curTime;

  accumTime += dt;

  while(accumTime >= MS_PER_FRAME) {
    accumTime -= MS_PER_FRAME;

    if(preferences.paused) continue;

    globalGameState.tickCount += SIM_FACTOR;

    if (globalGameState.tickCount % 60 === 0 && preferences.jumping) {
      for (let opponent of opponents) {
        let { fromPlanet, toPlanet, fractionToMove } = opponent.sampleAction();

        reassignFraction(fromPlanet, toPlanet, opponent.team, fractionToMove);
      }
      // const idx1 = Math.floor(seededRandom() * planets.length);
      // let idx2 = idx1;

      // while (idx2 == idx1) {
      //   idx2 = Math.floor(seededRandom() * planets.length);
      // }

      // if (preferences.jumping) reassignFraction(idx1, idx2, 'RED', 0.8);
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
    if (globalGameState.tickCount % 1 === 0) {
      //////////// compute statistics //////////////////
      const { totalPerTeam, teamCapacities, buckets } = gameStats.computeStatistics();

      ////////////// update ///////////////////////////
      let newShips = [...ships];
      buckets.forEach((bucket, planetIdx) => {

        /// combat ////
        let x = bucket.ships.length;
        const teams = Object.keys(bucket.counts);
        if (globalGameState.tickCount % 20 === 0) {
          let actionProb = x > 0 ? Math.exp((x - 30)/30) / (1 + Math.exp((x-30)/ 30)) : 0;
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
                x -= 1;
                explosions.push(new Explosion(ships[shipIdx].x, ships[shipIdx].y));
                break;
              }
            }
          }
        }

        /// allegiance switching ///
        teams.forEach(t => {
          if (preferences.drawDebug) {
            // console.log(bucket.counts[t], x, t);
          }

          if (bucket.counts[t] && bucket.counts[t] >= x) {
            // terraforming will be modified
            // planet.terraforming == {team: _____, completion: ______}
            // completion is greater than or equal to 0 at all times

            const planet = planets[planetIdx];
            if (planet.terraforming.team === t) {
              planet.terraforming.completion += bucket.counts[t]/BASE_TERRAFORMING_RATE/planet.size;
              if (planet.terraforming.completion >= 1) {
                planet.terraforming.completion = 1;
                planet.team = t;
              }
            } else if (planet.terraforming.team !== t) {
              planet.terraforming.completion -= bucket.counts[t]/BASE_TERRAFORMING_RATE/planet.size;
              planet.terraforming.completion = Math.max(planet.terraforming.completion, 0);
              if (planet.terraforming.completion === 0) {
                planet.team = null;
                planet.terraforming.team = t;
              }
            }
          }
        });

        /// production / generation / terraforming
        // generation is constant
        if (planets[planetIdx].terraforming.completion === 1) {
          if (totalPerTeam[planets[planetIdx].team] < teamCapacities[planets[planetIdx].team]) {
            // if we are over capacity, do not produce
            const productionRate = planets[planetIdx].size;
            const baseRate = Math.floor(500 / BASE_PRODUCTION_RATE);
            //console.log('generation');
            // console.log(globalGameState.tickCount / 20, Math.floor(baseRate / productionRate));
            if ((globalGameState.tickCount / 20) % (Math.ceil(baseRate / productionRate)+1) === 0) {
              // if (planetIdx === 0) {
              //   console.log(totalPerTeam, teamCapacities);
              // }
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
        }
      });
      globalGameState.ships = newShips;
    }

    const blueCount = ships.filter(ship => ship.team === 'BLUE').length;
    if (blueCount === ships.length && globalGameState.tickCount > 500) {
      globalGameState.gameResult = 'VICTORY';
    } else if (blueCount === 0 && globalGameState.tickCount > 500) {
      globalGameState.gameResult = 'DEFEAT';
    }

    if (globalGameState.gameResult) {
      for (let team of Object.keys(teamColorMap)) {
        reassignFraction(Math.floor(seededRandom() * planets.length), Math.floor(seededRandom() * planets.length), team, 0.3);
      }
    }

    // Step and draw each explosion
    for (const explosion of explosions) {
      explosion.step();
    }

    // Remove completed explosions
    explosions = explosions.filter(exp => !exp.isCompleted());
  }
  
  // NOTE(Apaar): Render as fast as possible (TODO: interpolate between frames)

  //////////////////////// rendering / RENDERING /////////////////////////////
  render(ctx, canvas, planets, ships, explosions, hoveredPlanet, selectedPlanets, preferences.drawDebug, globalGameState.gameResult, mouseX, mouseY);

  requestAnimationFrame(update);
}

function findClosestPlanet(w, z) {
  const { planets } = globalGameState;
  const distances = planets.map(({x, y}) => (x - w)*(x-w) + (y-z)*(y-z));
  let min = Math.min(...distances);
  let idx = distances.findIndex(dist => dist == min);
  return {planet: planets[idx], distance: min, idx };
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
      reassignFraction(planetIdx, hoveredPlanet, 'BLUE');
    });
  } else {
    selectedPlanets.length = 0;

  }

  isMouseDown = false;
});

canvas.addEventListener('click', () => {
  if (preferences.drawDebug) {
    console.log(JSON.stringify({mouseX, mouseY}));
  }
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

update(); // start loop
