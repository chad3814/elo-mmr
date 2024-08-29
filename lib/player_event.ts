import { DEFAULT_SIG_LIMIT } from "./elo_mmr";
import { Rating } from "./rating";

export class PlayerEvent {
    constructor(public rating: Rating, public performanceScore: number, public place: number) { }

    toString(stdevs = 2, sigLimit = DEFAULT_SIG_LIMIT): string {
        return `${this.rating.mu} ± ${stdevs * (this.rating.sig - sigLimit)}`;
    }

    toJSON() {
        return {
            rating: this.rating.toJSON(),
            perfScore: this.performanceScore,
            place: this.place,
        }
    }

    dup(): PlayerEvent {
         return new PlayerEvent(this.rating.dup(), this.performanceScore, this.place);
    }
}
