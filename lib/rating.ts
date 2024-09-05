import { DEFAULT_MU, DEFAULT_SIG } from "./elo_mmr";

export type RatingJSON = {
    mu: number;
    sig: number;
};

/**
 * Represents a player's rating
 * `mu` is the mean of the rating
 * `sig` is the uncertainty level of the rating
 */
export class Rating {
    constructor(public mu = DEFAULT_MU, public sig = DEFAULT_SIG) { }

    withNoise(sigNoise: number): Rating {
        const new_sig = Math.sqrt(this.sig**2 + sigNoise**2);
        return new Rating(this.mu, new_sig);
    }

    toJSON() {
        return {
            mu: this.mu,
            sig: this.sig,
        };
    }

    static fromJSON(obj: any): Rating {
        const rating = new Rating(obj.mu, obj.sig);
        return rating;
    }

    dup(): Rating {
        return new Rating(this.mu, this.sig);
    }
}
