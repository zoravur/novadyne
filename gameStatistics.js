// import levels from './levels.js';
import { teamColorMap } from "./constants.js";

// export function makeGame(levelNum) {
//     const {planets, ships} = structuredClone(levels[levelNum]);

//     return {
//         planets,
//         ships,
//         tickCount: 0,
//     }
// }

// export function stepGame(game)

export class GameStatistics {
    constructor(globalGameState) {
        this.gameState = globalGameState;
        this.currentTick = -1;
        this.state = {};
    }

    computeStatistics() {
        if (this.currentTick !== this.gameState.tickCount) {
            this.currentTick = this.gameState.tickCount;

            // update statistics -- start by moving over old code
            const { planets, ships } = this.gameState;

            let totalPerTeam = Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0]))
            let teamCapacities = planets.reduce((acc, planet) => { 
                acc[planet.team] = (acc[planet.team] || 0) + planet.size; 
                return acc; 
            }, {});
    
            let buckets = Array.from({length: planets.length}, (_, idx) => ({  
                ships: [], 
                counts: Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0])),
                idx,
            }));
            ships.forEach((ship, shipIdx) => {
                if (ship.orbiting) {
                    buckets[ship.planetIdx].ships.push(shipIdx);
                    buckets[ship.planetIdx].counts[ship.team] = buckets[ship.planetIdx].counts[ship.team] + 1 || 1;
                }
                totalPerTeam[ship.team] = totalPerTeam[ship.team] + 1 || 1;
            });

            const createTeamMap = (val) => Object.fromEntries(Object.keys(teamColorMap).map(t => [t, val]));
            
            
            // unifiedPlanetSummary[i] IS
            // idx: -- idx of planet in global array
            // totalShips: -- number of total ships on planet
            // totalOrbiting: -- number of total planets orbiting planet
            // totalTravelling: -- number of ships travelling to planet
            // NOTE: totalShips == totalOrbiting + totalTravelling
            // shipsBreakdown: -- {[team]: number}
            // orbitingBreakdown: -- {[team]: number}
            // totalTravelling: -- {[team]: number}
            // planetSize: -- planet size
            // team: -- current planet team
            // terraformingCompletion: -- the amount the planet has been converted to team terraformingTeam
            // terraformingTeam: the team for which the planet has been terraformed by amount terraformingCompletion
            const unifiedPlanetSummary = Array.from({length: planets.length}, 
                (_, i) => ({
                    idx: i,
                    totalShips: 0,
                    totalOrbiting: 0,
                    totalTravelling: 0,
                    shipsBreakdown: createTeamMap(0),
                    orbitingBreakdown: createTeamMap(0),
                    travellingBreakdown: createTeamMap(0),
                    x: planets[i].x,
                    y: planets[i].y,
                    planetSize: planets[i].size,
                    team: planets[i].team,
                    terraformingCompletion: planets[i].terraforming.completion,
                    terraformingTeam: planets[i].terraforming.team,
                }));


            // unifiedGlobalSummary IS
            // totalShips: -- ships.length
            // totalShipsBreakdown: -- {[team]: number} -- breakdown of totalShips by team
            const unifiedGlobalSummary = {}; // probably want something like the above

            ships.forEach((ship) => {

                /// Populate unifiedPlanetSummary
                const summary = unifiedPlanetSummary[ship.planetIdx];

                summary.totalShips += 1;
                summary.shipsBreakdown[ship.team] += 1;
                if (ship.orbiting) {
                    summary.totalOrbiting += 1;
                    summary.orbitingBreakdown[ship.team] += 1;
                } else {
                    summary.totalTravelling += 1;
                    summary.travellingBreakdown[ship.team] += 1;
                }

                /// populate global summary (TODO)
                // ... write some code ... 
            })

            this.state = {
                totalPerTeam,
                teamCapacities,
                buckets,
                unifiedPlanetSummary, 
            }
        }

        return this.state;
    }

    getBuckets() {
        return this.computeStatistics().buckets;
    }

    getTotalPerTeam() {
        return this.computeStatistics().totalPerTeam;
    }

    getTeamCapacities() {
        return this.computeStatistics().teamCapacities;
    }

    getUnifiedPlanetSummary() {
        return this.computeStatistics().unifiedPlanetSummary;
    }

    scorePlanets(scoringFunc, returnSorted) {
        const ups = this.getUnifiedPlanetSummary();
        const scores = ups.map((arg, idx) => ({ score: scoringFunc(arg), idx, }));

        if (returnSorted) {
            scores.sort((a, b) => (b.score - a.score)); // highest to lowest score
        }
        return scores;
    }

    // shipCount(team) {

    // }
}