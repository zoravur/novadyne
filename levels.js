import { randomColor, planetRandom } from "./util.js";

function createPlanet(x, y, team, size) {
  return {
    x, y, team,
    terraforming: {team, completion: team === null ? 0 : 1},
    size,
    color: randomColor(planetRandom),
  }
}

// LEVEL 1 COMPLETE
const level1 = {
  planets: [
    {
      x: 500,
      y: 300,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 40,
      color: randomColor(planetRandom),
    },
    {
      x: 700,
      y: 650,
      team: "RED",
      terraforming: { team: "RED", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
  ],
  ships: [],
};

// LEVEL 2 COMPLETE
const level3 = {
  planets: [
    {
      x: 1247,
      y: 419,
      team: "RED",
      terraforming: { team: "RED", completion: 1 },
      size: 90,
      color: randomColor(planetRandom),
    },
    {
      x: 900,
      y: 500,
      team: "RED",
      terraforming: { team: "RED", completion: 1 },
      size: 100,
      color: randomColor(planetRandom),
    },
    {
      x: 615,
      y: 277,
      team: "RED",
      terraforming: { team: "RED", completion: 1 },
      size: 75,
      color: randomColor(planetRandom),
    },
    {
      x: 297,
      y: 754,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 503,
      y: 616,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 860,
      y: 797,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 968,
      y: 1000,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 591,
      y: 845,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 40,
      color: randomColor(planetRandom),
    },
    {
      x: 1258,
      y: 822,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 40,
      color: randomColor(planetRandom),
    },
  ],
  ships: [],
};

const level2 = {
  planets: [
    {
      x: 300,
      y: 600,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 40,
      color: randomColor(planetRandom),
    },
    {
      x: 700,
      y: 400,
      team: null,
      terraforming: { team: null, completion: 0 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 700,
      y: 800,
      team: null,
      terraforming: { team: null, completion: 0 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 1100,
      y: 800,
      team: null,
      terraforming: { team: null, completion: 0 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 1100,
      y: 400,
      team: null,
      terraforming: { team: null, completion: 0 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 1500,
      y: 600,
      team: "RED",
      terraforming: { team: "RED", completion: 1 },
      size: 50,
      color: randomColor(planetRandom),
    },
  ],
  ships: [],
};

const level4 = {
  planets: [
    {
      x: 700-50,
      y: 800-50,
      team: "BLUE",
      terraforming: { team: "BLUE", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 1200-50,
      y: 800-50,
      team: "YELLOW",
      terraforming: { team: "YELLOW", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
    {
      x: 950-50,
      y: 400-50,
      team: "RED",
      terraforming: { team: "RED", completion: 1 },
      size: 30,
      color: randomColor(planetRandom),
    },
    createPlanet(700-50, 550-50, null, 30),
    createPlanet(1200-50, 550-50, null, 30),
    createPlanet(950-50, 950-50, null, 30),
  ],
  ships: [],
};

// const level5 


export const levels = [level1, level2, level3, level4];
