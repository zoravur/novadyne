import levels from './levels.js';

export function makeGame(levelNum) {
    const {planets, ships} = structuredClone(levels[levelNum]);

    return {
        planets,
        ships,
        tickCount: 0,
    }
}

export function stepGame(game)