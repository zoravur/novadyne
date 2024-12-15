import { teamColorMap } from "./constants.js";
import { rotateVec } from "./util.js";

export class Explosion {
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
    const scale =
      this.minScale + ((sineValue + 1) * (this.maxScale - this.minScale)) / 2;
    const currentRadius = this.baseRadius * scale;

    const colorMix = (-Math.cos(offsetTime / 1.5) + 1) / 2;
    const currentHue = 60 - colorMix * 60;

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

function drawPieSlice(
  ctx,
  centerX,
  centerY,
  outerRadius,
  innerRadius,
  color,
  startAngle,
  endAngle
) {
  ctx.beginPath();

  // move to the starting point on the outer radius
  ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);

  // if inner radius is greater than 0, connect to the inner circle
  if (innerRadius > 0) {
    // draw a line to the start point on the inner radius
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
  } else {
    // if no inner radius, close the path to the center
    ctx.lineTo(centerX, centerY);
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function drawTerraforming(ctx, planet) {
  let [centerX, centerY] = [planet.x, planet.y];

  let endAngle = planet.terraforming.completion * 2 * Math.PI; // goes from -2*Math.PI -- 2*Math.PI
  let startAngle = 0;

  // transform to start at top
  endAngle = Math.PI / 2 - endAngle;
  startAngle = Math.PI / 2 - startAngle;

  [startAngle, endAngle] = [
    Math.min(startAngle, endAngle),
    Math.max(startAngle, endAngle),
  ];

  let outerRadius = planet.size * 1.5;
  let innerRadius = planet.size * 1.4;

  let color = teamColorMap[planet.terraforming.team];

  drawPieSlice(
    ctx,
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    color,
    startAngle,
    endAngle
  );
}

export function drawShip(ctx, x, y, dx, dy, fill) {
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


const transformation = [
  [Math.sqrt(3)/2,-Math.sqrt(3)/2,-100],
  [1/2,1/2,-100]
];

const origin = {
  x: 900,
  y: 650,
}

const topLeft = {
  x: 0,
  y: 0,
}

const i_hat = {
  x: Math.sqrt(3)/2,
  y: -0.5,
}

const j_hat = {
  x: Math.sqrt(3)/2,
  y: 0.5,
}

const rotated_i = rotateVec(i_hat.x, i_hat.y, topLeft.x, topLeft.y, 0*-Math.PI/4);
const rotated_j = rotateVec(j_hat.x, j_hat.y, topLeft.x, topLeft.y, 0*-Math.PI/4);
const rotated_topLeft = rotateVec(topLeft.x, topLeft.y, origin.x, origin.y, -1*Math.atan2(origin.y, origin.x));

const rotationAboutCenter = [
  [rotated_i.x, rotated_j.x, rotated_topLeft.x],
  [rotated_i.y, rotated_j.y, rotated_topLeft.y],
]


export function render(ctx, canvas, planets, ships, explosions, hoveredPlanet, selectedPlanets, drawDebug, gameResult, mouseX, mouseY) {
  
  ctx.save();
  const [
    [a, c, e],
    [b, d, f]
  ] = rotationAboutCenter;
  console.log(rotationAboutCenter);
  ctx.transform(a, b, c, d, e, f);
  
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

    // draw the terraforming status:
    if (planet.terraforming.completion < 1) {
      drawTerraforming(ctx, planet);
    }

    // draw the carrying capacity (planet size) at the center
    ctx.font = "20px Arial"; // set font size and style
    ctx.textAlign = "center"; // center text horizontally
    ctx.textBaseline = "middle"; // center text vertically
    ctx.fillStyle = teamColorMap[planet.team] || 'white'; // text color
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
  });

  // Step and draw each explosion
  for (const explosion of explosions) {
    explosion.draw(ctx);
  }
  
  
  if (drawDebug) {
    const gridSpacing = 100;
    ctx.strokeStyle = "red"; // grid line color
    ctx.lineWidth = 0.5; // thin grid lines

    // draw vertical lines
    for (let x = 0; x <= canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // draw horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  if (gameResult !== null) {
    ctx.font = "bold 72px Arial"; // big bold text
    ctx.textAlign = "center"; // center the text horizontally
    ctx.textBaseline = "middle"; // center the text vertically
    ctx.fillStyle = gameResult === 'VICTORY' ? "gold" : "red"; // main text color
    ctx.strokeStyle = "black"; // outline color
    ctx.lineWidth = 4; // outline thickness

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // draw outline for contrast
    ctx.strokeText(gameResult, centerX, centerY);

    // draw the text
    ctx.fillText(gameResult, centerX, centerY);
  }

  ctx.restore();
}
