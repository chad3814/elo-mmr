import { DEFAULT_MU, DEFAULT_SIG } from "./elo_mmr";
import { Rating, RatingJSON } from "./rating";
import robustAverage from "./robust_average";
import { TanhTerm, TanhTermJSON } from "./tanh_term";
import Event, { EventJSON } from "./event";

export type PlayerJSON = {
    approximatePosterior: RatingJSON;
    normalFactor: RatingJSON;
    updateTime?: number;
    logisticFactors: TanhTermJSON[];
    events: EventJSON[];
}

export class Player {
    private normalFactor = new Rating(DEFAULT_MU, DEFAULT_SIG);
    private logisticFactors: TanhTerm[] = [];
    public eventHistory: Event[] = [];

    get numEvents() { return this.eventHistory.length; };

    constructor(public approximatePosterior: Rating, public updateTime?: Date, public deltaTime?: number) { }

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

    updateRatingWithLogistic(performance: Rating, place: number, maxHistory?: number): void {
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

        this.approximatePosterior = this.newApproximatePosterior(performance.sig);
        this.eventHistory.push(new Event(this.approximatePosterior, performance.mu, place));
    }

    newApproximatePosterior(performanceSig: number): Rating {
        const weightNormal = this.normalFactor.sig ** -2;
        const mu = robustAverage(
            this.logisticFactors.slice(),
            -this.normalFactor.mu * weightNormal,
            weightNormal
        );
        const sig = (this.approximatePosterior.sig ** -2 + performanceSig ** -2) ** -0.5;

        return new Rating(mu, sig);
    }

    toJSON(): PlayerJSON {
        return {
            approximatePosterior: this.approximatePosterior.toJSON(),
            normalFactor: this.normalFactor.toJSON(),
            updateTime: this.updateTime?.getTime(),
            logisticFactors: this.logisticFactors.map(lf => lf.toJSON()),
            events: this.eventHistory.map(e => e.toJSON()),
        };
    }

    static fromJSON(obj: PlayerJSON): Player {
        const player = new Player(Rating.fromJSON(obj.approximatePosterior), obj.updateTime ? new Date(obj.updateTime) : undefined);
        player.normalFactor = Rating.fromJSON(obj.normalFactor);
        player.logisticFactors = obj.logisticFactors.map((lf: any) => TanhTerm.fromJSON(lf));
        player.eventHistory = obj.events.map((e: any) => Event.fromJSON(e));
        return player;
    }

    dup(): Player {
        const player = new Player(this.approximatePosterior.dup(), this.updateTime, this.deltaTime);
        player.normalFactor = this.normalFactor.dup();
        player.logisticFactors = this.logisticFactors.map(lf => lf.dup());
        player.eventHistory = this.eventHistory.map(e => e.dup());
        return player;
    }
}
