import { computeSquaredDistance, createSeededRandom, fisherYates } from "./util.js";
import { teamColorMap } from "./constants.js";

export class RandomAI {
    constructor(globalGameState, team) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
    }

    randomAction() {
        const { planets, ships } = this.gameState;
        
        const idx1 = Math.floor(this.seededRandom() * planets.length);
        let idx2 = idx1;
        
        while (idx2 == idx1) {
          idx2 = Math.floor(this.seededRandom() * planets.length);
        }

        const action = {
            fromPlanet: idx1,
            toPlanet: idx2,
            fractionToMove: 0.8,
        }

        // console.log(JSON.stringify(action));
        return action;
    }

    sampleAction() {
        return this.randomAction();
    }
}


export class GreedyAI {
    constructor(globalGameState, team, gameStats) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
        this.gameStats = gameStats;
    }

    attackingAction() {
        const { planets, ships } = this.gameState;

        const buckets = this.gameStats.getBuckets().slice();

        // let totalPerTeam = Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0]))

        // let buckets = Array.from({length: planets.length}, (_, idx) => ({  
        //   ships: [], 
        //   counts: Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0])),
        //   idx,
        // }));
        // ships.forEach((ship, shipIdx) => {
        //   if (ship.orbiting) {
        //     buckets[ship.planetIdx].ships.push(shipIdx);
        //     buckets[ship.planetIdx].counts[ship.team] = buckets[ship.planetIdx].counts[ship.team] + 1 || 1;
        //   }
        //   totalPerTeam[ship.team] = totalPerTeam[ship.team] + 1 || 1;
        // });

        fisherYates(buckets); // shuffle

        // if enemy_planets_in_range:
        //     target = weakest(enemy_planets_in_range)
        //     send_ships(target)
        // elif unoccupied_planets_in_range:
        //     target = nearest(unoccupied_planets_in_range)
        //     send_ships(target)
        // else:
        //     reinforce_strongest_owned_planet()
        
        let weakest_enemy_planet = null;
        let weakest_seen = Infinity;
        let smallest_unoccupied_planet = null;
        let smallest_planet_size = Infinity;
        let strongest_ally_planet = null;
        let strongest_ally_ships = -Infinity;
        for (let bucket of buckets) {
            let total_count = Object.keys(bucket.counts).reduce((acc, t) => acc + bucket.counts[t],0);
            let ally_count = bucket.counts[this.team];
            let enemy_count = total_count - ally_count;
            
            if (ally_count > strongest_ally_ships) {
                // prefer staying on unoccupied planets.
                if (planets[bucket.idx].team === this.team || this.seededRandom() < 0.4) {
                    strongest_ally_planet = bucket.idx;
                    strongest_ally_ships = ally_count;
                }
            }

            if (enemy_count === 0 && planets[bucket.idx].size < smallest_planet_size) {
                smallest_planet_size = planets[bucket.idx].size;
                smallest_unoccupied_planet = bucket.idx;
            } else if (enemy_count > 0 && enemy_count < weakest_seen) {
                weakest_seen = enemy_count;
                weakest_enemy_planet = bucket.idx;
            }
        }


        const action = {
            fromPlanet: strongest_ally_planet,
            fractionToMove: 0.8,
        }

        if (smallest_unoccupied_planet !== null) action.toPlanet = smallest_unoccupied_planet;

        if (weakest_enemy_planet !== null) action.toPlanet = weakest_enemy_planet;

        if (action.toPlanet || action.toPlanet === 0) {
            return action;
        }
        return null;
    }

    randomAction() {
        const { planets, ships } = this.gameState;
        
        const idx1 = Math.floor(this.seededRandom() * planets.length);
        let idx2 = idx1;
        
        while (idx2 == idx1) {
          idx2 = Math.floor(this.seededRandom() * planets.length);
        }

        const action = {
            fromPlanet: idx1,
            toPlanet: idx2,
            fractionToMove: 0.8,
        }

        // console.log(JSON.stringify(action));
        return action;
    }

    sampleAction() {
        const attackingAction = this.attackingAction();
        if (attackingAction !== null) {
            return attackingAction;
        }
        return this.randomAction();
    }
}

export class MixedAI {
    constructor(globalGameState, team, gameStats) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;

        this.GreedyAI = new GreedyAI(this.gameState, this.team, gameStats);
        this.RandomAI = new RandomAI(this.gameState, this.team);
    }

    sampleAction() {
        if (this.seededRandom() < 0.7) {
            return this.GreedyAI.sampleAction();
        }
        return this.RandomAI.sampleAction();
    }
}

export class DefensiveAI {
    constructor(globalGameState, team, gameStats) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
        this.gameStats = gameStats;
    }

    // attack() {

    // }

    // defend() {

    // }

    // wait() {

    // }

    attackingAction() {
        const { planets, ships } = this.gameState;

        const buckets = this.gameStats.getBuckets().slice();

        // let totalPerTeam = Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0]))

        // let buckets = Array.from({length: planets.length}, (_, idx) => ({  
        //   ships: [], 
        //   counts: Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0])),
        //   idx,
        // }));
        // ships.forEach((ship, shipIdx) => {
        //   if (ship.orbiting) {
        //     buckets[ship.planetIdx].ships.push(shipIdx);
        //     buckets[ship.planetIdx].counts[ship.team] = buckets[ship.planetIdx].counts[ship.team] + 1 || 1;
        //   }
        //   totalPerTeam[ship.team] = totalPerTeam[ship.team] + 1 || 1;
        // });

        fisherYates(buckets); // shuffle

        // if enemy_planets_in_range:
        //     target = weakest(enemy_planets_in_range)
        //     send_ships(target)
        // elif unoccupied_planets_in_range:
        //     target = nearest(unoccupied_planets_in_range)
        //     send_ships(target)
        // else:
        //     reinforce_strongest_owned_planet()
        
        let weakest_enemy_planet = null;
        let weakest_seen = Infinity;
        let smallest_unoccupied_planet = null;
        let smallest_planet_size = Infinity;
        let strongest_ally_planet = null;
        let strongest_ally_ships = -Infinity;
        for (let bucket of buckets) {
            let total_count = Object.keys(bucket.counts).reduce((acc, t) => acc + bucket.counts[t],0);
            let ally_count = bucket.counts[this.team];
            let enemy_count = total_count - ally_count;
            
            if (ally_count > strongest_ally_ships) {
                // prefer staying on unoccupied planets.
                if (planets[bucket.idx].team === this.team || this.seededRandom() < 0.4) {
                    strongest_ally_planet = bucket.idx;
                    strongest_ally_ships = ally_count;
                }
            }

            if (enemy_count === 0 && planets[bucket.idx].size < smallest_planet_size) {
                smallest_planet_size = planets[bucket.idx].size;
                smallest_unoccupied_planet = bucket.idx;
            } else if (enemy_count > 0 && enemy_count < weakest_seen) {
                weakest_seen = enemy_count;
                weakest_enemy_planet = bucket.idx;
            }
        }


        const action = {
            fromPlanet: strongest_ally_planet,
            fractionToMove: 0.8,
        }

        if (smallest_unoccupied_planet !== null) action.toPlanet = smallest_unoccupied_planet;

        if (weakest_enemy_planet !== null) action.toPlanet = weakest_enemy_planet;

        if (action.toPlanet || action.toPlanet === 0) {
            return action;
        }
        return null;
    }

    recapturePlanets() {
        
        // how do we expect getStrongestPlanet to work?
        // We want the planet with the highest number of orbiting 
        //  ally ships (team with ships with team === team)
        // const strongestPlanetIdx = this.gameStats.getStrongestAllyPlanet(team); 
        // this.gameStats.scorePlanets('STRONGEST_ALLY_PLANET', () => {

        // }, true)
        const { planets } = this.gameState;


        const { idx, score: strongestAllyPlanetShipCount } = this.gameStats.scorePlanets(({ shipsBreakdown: {[this.team]: allyShipCount}}) => allyShipCount, true)[0];

        const bestRecapturablePlanets = this.gameStats.scorePlanets((unifiedPlanetSummary) => {
            // console.log(unifiedPlanetSummary);
            const { shipsBreakdown: {[this.team]: allyShipCount}, totalShips, terraformingTeam, terraformingCompletion } = unifiedPlanetSummary;
            const enemyShipCount = totalShips - allyShipCount;
            const terraformAmount = (terraformingTeam === this.team ? 1 : -1) * terraformingCompletion;

            // console.log(JSON.stringify({
            //     idx, strongestAllyPlanetShipCount, unifiedPlanetSummary, enemyShipCount, terraformAmount
            // }));
            if (enemyShipCount < 0.6 * strongestAllyPlanetShipCount) {
                return terraformAmount;
            }
            return 0;
        }, 
        // the second parameter to scorePlanets determines if we should return the array in sorted 
        // order from highest to lowest score, or if we should leave it unsorted.
        true).filter(({ score }) => score > 0 && score < 1);

        // console.log(bestRecapturablePlanets);

        if (bestRecapturablePlanets.length > 0) {
            // console.log(`recapturing planet ${bestRecapturablePlanets[0].idx}`);
            return {
                fromPlanet: idx, 
                toPlanet: bestRecapturablePlanets[0].idx,
                fractionToMove: 0.8,
            }
        } else {
            return null;
        }
    }

    // classifyPlanets() {
    //     // classifications:

    //     // DESTINATIONS
    //     // recapturable
    //     // defendable
    //     // attackable (weak)


    //     // SOURCES
    //     // strong: ally-owned, with 15+ ships
    //     // retreatable: fight is losing badly 3:5 odds and not defendable


    //     const planetClasses = this.gameStats.scorePlanets((unifiedPlanetSummary) => {
    //         let recapturableScore = null;
    //         const { shipsBreakdown: {[this.team]: allyShipCount}, totalShips, terraformingTeam, terraformingCompletion } = unifiedPlanetSummary;
    //         const enemyShipCount = totalShips - allyShipCount;
    //         const terraformAmount = (terraformingTeam === this.team ? 1 : -1) * terraformingCompletion;

    //         console.log(JSON.stringify({
    //             idx, strongestAllyPlanetShipCount, unifiedPlanetSummary, enemyShipCount, terraformAmount
    //         }));
    //         if (enemyShipCount < 0.6 * strongestAllyPlanetShipCount) {
    //             recapturableScore = terraformAmount;
    //         }
            
    //         if (recapturableScore < 0 && recapturableScore > 1) return 'RECAPTURABLE';

    //         let defendable = null;
    //         const { shipsBreakdown: }
    //     })

        
    // }

    randomAction() {
        const { planets, ships } = this.gameState;
        
        const idx1 = Math.floor(this.seededRandom() * planets.length);
        let idx2 = idx1;
        
        while (idx2 == idx1) {
          idx2 = Math.floor(this.seededRandom() * planets.length);
        }

        const action = {
            fromPlanet: idx1,
            toPlanet: idx2,
            fractionToMove: 0.8,
        }

        // console.log(JSON.stringify(action));
        return action;
    }

    nullAction() {
        return {fromPlanet: 0, toPlanet: 0, fractionToMove: 0};
    }

    sampleAction() {
        const ATTACKING = 'ATTACKING';
        const DEFENDING = 'DEFENDING';
        const WAITING = 'WAITING';

        return this.recapturePlanets() ||
        // this.attackingAction() || 
        this.nullAction();
    }

    // calcAdvantage() {
    //     // number of ships
    // }
}


export class CleverAI {
    constructor(globalGameState, team, gameStats) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
        this.gameStats = gameStats;
    }

    // attack() {

    // }

    // defend() {

    // }

    // wait() {

    // }

    attackingAction() {
        const { planets, ships } = this.gameState;

        const buckets = this.gameStats.getBuckets().slice();

        // let totalPerTeam = Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0]))

        // let buckets = Array.from({length: planets.length}, (_, idx) => ({  
        //   ships: [], 
        //   counts: Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0])),
        //   idx,
        // }));
        // ships.forEach((ship, shipIdx) => {
        //   if (ship.orbiting) {
        //     buckets[ship.planetIdx].ships.push(shipIdx);
        //     buckets[ship.planetIdx].counts[ship.team] = buckets[ship.planetIdx].counts[ship.team] + 1 || 1;
        //   }
        //   totalPerTeam[ship.team] = totalPerTeam[ship.team] + 1 || 1;
        // });

        fisherYates(buckets); // shuffle

        // if enemy_planets_in_range:
        //     target = weakest(enemy_planets_in_range)
        //     send_ships(target)
        // elif unoccupied_planets_in_range:
        //     target = nearest(unoccupied_planets_in_range)
        //     send_ships(target)
        // else:
        //     reinforce_strongest_owned_planet()
        
        let weakest_enemy_planet = null;
        let weakest_seen = Infinity;
        let smallest_unoccupied_planet = null;
        let smallest_planet_size = Infinity;
        let strongest_ally_planet = null;
        let strongest_ally_ships = -Infinity;
        for (let bucket of buckets) {
            let total_count = Object.keys(bucket.counts).reduce((acc, t) => acc + bucket.counts[t],0);
            let ally_count = bucket.counts[this.team];
            let enemy_count = total_count - ally_count;
            
            if (ally_count > strongest_ally_ships) {
                // prefer staying on unoccupied planets.
                if (planets[bucket.idx].team === this.team || this.seededRandom() < 0.4) {
                    strongest_ally_planet = bucket.idx;
                    strongest_ally_ships = ally_count;
                }
            }

            if (enemy_count === 0 && planets[bucket.idx].size < smallest_planet_size) {
                smallest_planet_size = planets[bucket.idx].size;
                smallest_unoccupied_planet = bucket.idx;
            } else if (enemy_count > 0 && enemy_count < weakest_seen) {
                weakest_seen = enemy_count;
                weakest_enemy_planet = bucket.idx;
            }
        }


        const action = {
            fromPlanet: strongest_ally_planet,
            fractionToMove: 0.8,
        }
        
        if (weakest_enemy_planet !== null) action.toPlanet = weakest_enemy_planet;

        if (smallest_unoccupied_planet !== null) action.toPlanet = smallest_unoccupied_planet;


        if (action.toPlanet || action.toPlanet === 0) {
            return action;
        }
        return null;
    }

    recapturePlanets() {
        
        // how do we expect getStrongestPlanet to work?
        // We want the planet with the highest number of orbiting 
        //  ally ships (team with ships with team === team)
        // const strongestPlanetIdx = this.gameStats.getStrongestAllyPlanet(team); 
        // this.gameStats.scorePlanets('STRONGEST_ALLY_PLANET', () => {

        // }, true)
        const { planets } = this.gameState;


        const { idx, score: strongestAllyPlanetShipCount } = this.gameStats.scorePlanets(({ shipsBreakdown: {[this.team]: allyShipCount}}) => allyShipCount, true)[0];

        const bestRecapturablePlanets = this.gameStats.scorePlanets((unifiedPlanetSummary) => {
            // console.log(unifiedPlanetSummary);
            const { shipsBreakdown: {[this.team]: allyShipCount}, totalShips, terraformingTeam, terraformingCompletion } = unifiedPlanetSummary;
            const enemyShipCount = totalShips - allyShipCount;
            const terraformAmount = (terraformingTeam === this.team ? 1 : -1) * terraformingCompletion;

            // console.log(JSON.stringify({
            //     idx, strongestAllyPlanetShipCount, unifiedPlanetSummary, enemyShipCount, terraformAmount
            // }));
            if (enemyShipCount < 0.6 * strongestAllyPlanetShipCount) {
                return terraformAmount;
            }
            return 0;
        }, 
        // the second parameter to scorePlanets determines if we should return the array in sorted 
        // order from highest to lowest score, or if we should leave it unsorted.
        true).filter(({ score }) => score > 0 && score < 1);

        // console.log(bestRecapturablePlanets);

        if (bestRecapturablePlanets.length > 0) {
            // console.log(`recapturing planet ${bestRecapturablePlanets[0].idx}`);
            return {
                fromPlanet: idx, 
                toPlanet: bestRecapturablePlanets[0].idx,
                fractionToMove: 0.8,
            }
        } else {
            return null;
        }
    }

    // classifyPlanets() {
    //     // classifications:

    //     // DESTINATIONS
    //     // recapturable
    //     // defendable
    //     // attackable (weak)


    //     // SOURCES
    //     // strong: ally-owned, with 15+ ships
    //     // retreatable: fight is losing badly 3:5 odds and not defendable


    //     const planetClasses = this.gameStats.scorePlanets((unifiedPlanetSummary) => {
    //         let recapturableScore = null;
    //         const { shipsBreakdown: {[this.team]: allyShipCount}, totalShips, terraformingTeam, terraformingCompletion } = unifiedPlanetSummary;
    //         const enemyShipCount = totalShips - allyShipCount;
    //         const terraformAmount = (terraformingTeam === this.team ? 1 : -1) * terraformingCompletion;

    //         console.log(JSON.stringify({
    //             idx, strongestAllyPlanetShipCount, unifiedPlanetSummary, enemyShipCount, terraformAmount
    //         }));
    //         if (enemyShipCount < 0.6 * strongestAllyPlanetShipCount) {
    //             recapturableScore = terraformAmount;
    //         }
            
    //         if (recapturableScore < 0 && recapturableScore > 1) return 'RECAPTURABLE';

    //         let defendable = null;
    //         const { shipsBreakdown: }
    //     })

        
    // }

    randomAction() {
        const { planets, ships } = this.gameState;
        
        const idx1 = Math.floor(this.seededRandom() * planets.length);
        let idx2 = idx1;
        
        while (idx2 == idx1) {
          idx2 = Math.floor(this.seededRandom() * planets.length);
        }

        const action = {
            fromPlanet: idx1,
            toPlanet: idx2,
            fractionToMove: 0.8,
        }

        // console.log(JSON.stringify(action));
        return action;
    }

    nullAction() {
        return {fromPlanet: 0, toPlanet: 0, fractionToMove: 0};
    }

    sampleAction() {
        const ATTACKING = 'ATTACKING';
        const DEFENDING = 'DEFENDING';
        const WAITING = 'WAITING';

        return this.recapturePlanets() ||
        this.attackingAction() || 
        this.nullAction();
    }

    // calcAdvantage() {
    //     // number of ships
    // }
}

export class NullAI {
    constructor(globalGameState, team, gameStats) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
        this.gameStats = gameStats;
    }

    nullAction() {
        return {fromPlanet: 0, toPlanet: 0, fractionToMove: 0};
    }

    sampleAction() {
        return this.nullAction();
    }

    // calcAdvantage() {
    //     // number of ships
    // }
}