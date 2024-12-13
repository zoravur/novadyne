// import levels from './levels.js';

// export function makeGame(levelNum) {
//     const {planets, ships} = structuredClone(levels[levelNum]);

//     return {
//         planets,
//         ships,
//         tickCount: 0,
//     }
// }

// export function stepGame(game)

class GameStatistics {
    constructor(globalGameState) {
        this.gameState = globalGameState;
        this.currentTick = -1;
    }

    computeStatistics() {
        if (this.currentTick === this.gameState.tickCount) {
            return;
        }

    }

    shipCount(team) {

    }
}