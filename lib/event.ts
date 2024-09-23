import { DEFAULT_SIG_LIMIT } from "./elo_mmr";
import { Rating, RatingJSON } from "./rating";

export type EventJSON = {
    rating: RatingJSON;
    performanceScore: number;
    place: number;
};

export default class Event {
    constructor(rating: Rating, performanceScore: number, readonly place: number) {
        this.rating = new Rating(Math.round(rating.mu), Math.round(rating.sig));
        this.performanceScore = Math.round(performanceScore);
    }

    dup(): Event {
        const rating = this.rating.dup();
        return new Event(rating, this.performanceScore, this.place);
    }

    toString(stdevs: number = 2, sigLimit: number = DEFAULT_SIG_LIMIT): string {
        return `${this.rating.mu} ± ${stdevs * (this.rating.sig - sigLimit)}`;
    }

    toJSON() {
        return {
            rating: this.rating.toJSON(),
            performanceScore: this.performanceScore,
            place: this.place,
        }
    }

    static fromJSON(obj: EventJSON): Event {
        const rating = Rating.fromJSON(obj.rating);
        return new Event(rating, obj.performanceScore, obj.place);
    }

    readonly rating: Rating;
    readonly performanceScore: number;
}
