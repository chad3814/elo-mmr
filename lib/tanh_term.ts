import { TANH_MULTIPLIER } from "./elo_mmr";
import { Rating } from "./rating";

export type TanhTermJSON = {
    mu: number;
    wArg: number;
    wOut: number;
}

/**
 * represents... something
 */
export class TanhTerm {
    constructor(public mu: number, public wArg: number, public wOut: number) { }

    getWeight(): number {
        return this.wOut * this.wArg * 2 / (TANH_MULTIPLIER**2);
    }

    baseValues(x: number): [number, number] {
        const z = (x - this.mu) * this.wArg;
        const val = -Math.tanh(z) * this.wOut;
        const valPrime = -(Math.cosh(z) ** -2)   * this.wArg * this.wOut;
        return [val, valPrime];
    }

    static fromRating(r: Rating): TanhTerm {
        const w = TANH_MULTIPLIER / r.sig;
        return new TanhTerm(r.mu, w * 0.5, w);
    }

    toJSON(): TanhTermJSON {
        return {
            mu: this.mu,
            wArg: this.wArg,
            wOut: this.wOut,
        };
    }

    static fromJSON(json: TanhTermJSON): TanhTerm {
        return new TanhTerm(json.mu, json.wArg, json.wOut);
    }

    dup(): TanhTerm {
        return new TanhTerm(this.mu, this.wArg, this.wOut);
    }
}
