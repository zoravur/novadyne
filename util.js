//// UTIL FUNCTIONS /////////
export function createSeededRandom(seed) {
  let state = seed;
  return function () {
    // LCG constants
    state = (state * 1664525 + 1013904223) % 4294967296;
    return (state >>> 0) / 4294967296; // Convert to a [0, 1) float
  };
}

export function normalizeVec(x, y) {
  const d = Math.sqrt(x * x + y * y);
  return { x: x / d, y: y / d };
}

export function fastSoftmaxSample(arr) {
  const minVal = Math.min(...arr);
  const maxVal = Math.max(...arr);

  // normalize to [0, 1]
  const normalized = arr.map((v) => (v - minVal) / (maxVal - minVal));
  const sum = normalized.reduce((acc, v) => acc + v, 0);
  const probabilities = normalized.map((v) => v / sum); // normalize to sum to 1

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

export function computeSquaredDistance(entity1, entity2) {
    const {x, y} = entity1;
    const {x: w, y: z} = entity2;
    return (x-w)*(x-w) + (y-z)*(y-z);
}

export function fisherYates(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // swap
    }
    return array; 
}


export const createCounter = els => Object.fromEntries(els.map(el => [el, 0]));

export function randomColor(randomFunc) {
  return `hsl(${randomFunc() * 360}, 65%, 55%)`;
}

export const planetRandom = createSeededRandom(1);

export const rotateVec = (x, y, h, k, theta) => {
  // convert degrees to radians
  const radians = theta;
  
  // translate the point to origin
  const translatedX = x - h;
  const translatedY = y - k;

  // apply the rotation
  const rotatedX = translatedX * Math.cos(radians) - translatedY * Math.sin(radians);
  const rotatedY = translatedX * Math.sin(radians) + translatedY * Math.cos(radians);

  // translate the point back
  const finalX = rotatedX + h;
  const finalY = rotatedY + k;

  return { x: finalX, y: finalY };
};