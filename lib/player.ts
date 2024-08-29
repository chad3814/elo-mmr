import { DEFAULT_MU, DEFAULT_SIG } from "./elo_mmr";
import { PlayerEvent } from "./player_event";
import { Rating } from "./rating";
import robustAverage from "./robust_average";
import { TanhTerm } from "./tanh_term";

export class Player {
    private normalFactor = new Rating(DEFAULT_MU, DEFAULT_SIG);
    private logisticFactors: TanhTerm[] = [];

    constructor(public eventHistory: PlayerEvent[], public approximatePosterior: Rating, public updateTime?: Date, public deltaTime?: number) { }

    addNoiseBest(sigNoise: number, transferSpeed: number): void {
        const newPosterior = this.approximatePosterior.withNoise(sigNoise);

        const decay = (this.approximatePosterior.sig / newPosterior.sig) ** 2;
        const transfer = decay ** transferSpeed;
        this.approximatePosterior = newPosterior;

        const weightNormOld = this.normalFactor.sig ** -2;
        const weightFromNormOld = transfer * weightNormOld;
        const weightFromTransfer = (1 - transfer) * (
            weightNormOld + this.logisticFactors.reduce(
                (acc, f) => acc + f.getWeight()
            , 0)
        );
        const weightTotal = weightFromNormOld + weightFromTransfer;

        this.normalFactor.mu = (
            weightFromNormOld * this.normalFactor.mu
            + weightFromTransfer * this.approximatePosterior.mu
        ) / weightTotal;
        this.normalFactor.sig = (decay * weightTotal) ** -0.5;
        for (const r of this.logisticFactors) {
            r.wOut *= transfer * decay;
        }
    }

    updateRating(rating: Rating, performanceScore: number): void {
        // assumes that a placeholder history item has been pushed
        if (this.eventHistory.length < 1) {
            throw new Error('Expected placeholder history item');
        }
        const lastEvent = this.eventHistory[this.eventHistory.length - 1];
        if (lastEvent.rating.mu !== 0 || lastEvent.rating.sig !== 0 || lastEvent.performanceScore !== 0) {
            throw new Error('Expected placeholder history item');
        }

        this.approximatePosterior = rating;
        lastEvent.rating.mu = Math.round(rating.mu);
        lastEvent.rating.sig = Math.round(rating.sig);
        lastEvent.performanceScore = Math.round(performanceScore);
    }

    updateRatingWithLogistic(performance: Rating, maxHistory?: number): void {
        if (maxHistory != null) {
            while (this.logisticFactors.length >= maxHistory) {
                const logistic = this.logisticFactors.shift()!;
                const weightNormal = this.normalFactor.sig ** -2;
                const weightLogistic = logistic.getWeight();
                this.normalFactor.mu = (
                    weightNormal * this.normalFactor.mu + weightLogistic * logistic.mu
                ) / (weightNormal + weightLogistic);
                this.normalFactor.sig = (weightNormal + weightLogistic) ** -0.5;
            }
        }
        this.logisticFactors.push(TanhTerm.fromRating(performance));

        const newRating = this.newApproximatePosterior(performance.sig);
        this.updateRating(newRating, performance.mu);
    }

    newApproximatePosterior(performanceSig: number): Rating {
        const weightNormal = this.normalFactor.sig ** -2;
        const mu = robustAverage(
            this.logisticFactors.slice(),
            this.normalFactor.mu * weightNormal,
            weightNormal
        );
        const sig = (this.approximatePosterior.sig ** -2 + performanceSig ** -2) ** -0.5;

        return new Rating(mu, sig);
    }

    dup(): Player {
        const player = new Player(this.eventHistory.map(eh => eh.dup()), this.approximatePosterior.dup(), this.updateTime, this.deltaTime);
        player.normalFactor = this.normalFactor.dup();
        player.logisticFactors = this.logisticFactors.map(lf => lf.dup());
        return player;
    }
}