import { computeLikelihoodSum } from "./compute_likelihood_sum";
import { Player } from "./player";
import { Rating } from "./rating";
import { solveNewton } from "./solve_newton";
import { TanhTerm } from "./tanh_term";

export const TANH_MULTIPLIER = Math.PI / Math.sqrt(3);
export const DEFAULT_MU = 1500;
export const DEFAULT_SIG = 350;
export const DEFAULT_WEIGHT_LIMIT = 0.2;
export const DEFAULT_SIG_LIMIT = 80;
export const BOUNDS: [number, number] = [-6000, 9000];

export type Standing = [
    Player,
    number,
    number
];

export class EloMmr {
    constructor(
        splitTies = false,
        private driftPerSec = 0,
        private weightLimit = DEFAULT_WEIGHT_LIMIT,
        private noobDelay = [],
        private sigLimit = DEFAULT_SIG_LIMIT,
        private transferSpeed = 1,
        private maxHistory?: number
    ) {
        this.mult = (splitTies ? 2 : 1);
    }

    roundUpdate(standings: Standing[], contestTime: Date, weight = 1, performanceCeiling?: number) {
        for (const [player, lo, _] of standings) {
            if (player.updateTime == null) {
                player.deltaTime = 0;
                player.updateTime = contestTime;
            } else {
                player.deltaTime = contestTime.getTime() - player.updateTime.getTime();
                player.updateTime = contestTime;
            }
        }

        const tanhTerms: TanhTerm[] = [];
        for (const [player] of standings) {
            const [sigPerformance, discreteDrift] = this.sigPerformanceAndDrift(weight, player.numEvents);
            const continousDrift = this.driftPerSec * (player.deltaTime! / 1000);
            const sigDrift = Math.sqrt(discreteDrift + continousDrift);
            player.addNoiseBest(sigDrift, this.transferSpeed);
            const withNoise = player.approximatePosterior.withNoise(sigPerformance);
            const tanhTerm = TanhTerm.fromRating(withNoise);
            tanhTerms.push(tanhTerm);
        }

        for (const [player, low, high] of standings) {
            const f = (x: number) => computeLikelihoodSum(x, tanhTerms, low, high, this.mult);
            const solved = solveNewton(BOUNDS, f);

            let muPerformance = solved;
            if (performanceCeiling != null) {
                muPerformance = Math.min(solved, performanceCeiling);
            }

            const [sigPerformance] = this.sigPerformanceAndDrift(weight, player.numEvents);
            player.updateRatingWithLogistic(new Rating(muPerformance, sigPerformance), this.maxHistory);
        }
    }

    individualUpdate(player: Player, low: number, high: number, standings: Standing[], contestTime: Date = new Date(0), weight = 1, performanceCeiling?: number) {
        const dummyStandings: Standing[] = standings.map(s => [s[0].dup(), s[1], s[2]]);

        for (let [player_, low_, high_] of dummyStandings) {
            if (low_ === low && high_ === high) {
                player_ = player;
            }
            if (player_.updateTime == null) {
                player_.deltaTime = 0;
                player_.updateTime = contestTime;
            } else {
                player_.deltaTime = contestTime.getTime() - player_.updateTime!.getTime();
                player_.updateTime = contestTime;
            }
        }

        const tanhTerms: TanhTerm[] = [];
        for (let [player_, low_, high_] of dummyStandings) {
            if (low_ === low && high_ === high) {
                player_ = player;
            }
            const [sigPerformance, discreteDrift] = this.sigPerformanceAndDrift(weight, player.numEvents);
            const continousDrift = this.driftPerSec * (player.deltaTime! / 1000);
            const sigDrift = Math.sqrt(discreteDrift + continousDrift);
            player.addNoiseBest(sigDrift, this.transferSpeed);
            const withNoise = player.approximatePosterior.withNoise(sigPerformance);
            const tanhTerm = TanhTerm.fromRating(withNoise);
            tanhTerms.push(tanhTerm);
        }
        const f = (x: number) => computeLikelihoodSum(x, tanhTerms, low, high, this.mult);
        const solved = solveNewton(BOUNDS, f);

        let muPerformance = solved;
        if (performanceCeiling != null) {
            muPerformance = Math.min(solved, performanceCeiling);
        }

        const [sigPerformance] = this.sigPerformanceAndDrift(weight, player.numEvents);
        player.updateRatingWithLogistic(new Rating(muPerformance, sigPerformance), this.maxHistory);
    }

    sigPerformanceAndDrift(weight: number, n: number): [number, number] {
        weight *= this.weightLimit;
        if (n < this.noobDelay.length) {
            weight *= this.noobDelay[n];
        }
        const sigPerformance = this.sigLimit * Math.sqrt(1 + 1/weight);
        const sigDriftSq = weight * this.sigLimit ** 2;
        return [sigPerformance, sigDriftSq];
    }

    private mult: 1 | 2;
}