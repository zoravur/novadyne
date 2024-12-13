import { createSeededRandom, fisherYates } from "./util.js";
import { teamColorMap } from "./constants.js";

export class RandomAI {
    constructor(globalGameState, team) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
    }

    sampleAction() {
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
}


export class GreedyAI {
    constructor(globalGameState, team) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
    }

    sampleAction() {
        const { planets, ships } = this.gameState;

        let totalPerTeam = Object.fromEntries(Object.keys(teamColorMap).map(team => [team, 0]))

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
            toPlanet: smallest_unoccupied_planet || weakest_enemy_planet || buckets[0].idx,
            fractionToMove: 0.8,
        }

        // console.log(JSON.stringify(action));
        return action;
    }
}

export class MixedAI {
    constructor(globalGameState, team) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;

        this.GreedyAI = new GreedyAI(this.gameState, this.team);
        this.RandomAI = new RandomAI(this.gameState, this.team);
    }

    sampleAction() {
        if (this.seededRandom() < 0.7) {
            return this.GreedyAI.sampleAction();
        }
        return this.RandomAI.sampleAction();
    }
}


export class OpenAI {
    constructor(globalGameState, team) {
        this.gameState = globalGameState;
        this.seededRandom = createSeededRandom(42);
        this.team = team;
    }

    sampleAction() {
    }

    determinePhase() {
        const ATTACKING = 'ATTACKING';
        const DEFENDING = 'DEFENDING';
        const WAITING = 'WAITING';
        
        const totalForces = 


        const phases =
            ATTACKING: 'ATTACKING',
            DEFENDING: 'DEFENDING',
            
        ]
    }

    // calcAdvantage() {
    //     // number of ships
    // }
}
