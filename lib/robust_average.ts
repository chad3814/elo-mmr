import { BOUNDS } from "./elo_mmr";
import { solveNewton } from "./solve_newton";
import { TanhTerm } from "./tanh_term";

/**
 * robustAverage
 * Return the unique zero of the following, strictly increasing function of x:
 * `offset + slope * x + sum_i weight_i * tanh((x - mu_i) / sig_i)`
 *
 * We must have `slope !== 0` or `Math.abs(offset) < sum_i weight_i` in order
 * for the zero to exist. If `offset === slope === 0`, we get robust weighted
 * average of the mu_i's.
 */
export default function robustAverage(allTanhTerms: TanhTerm[], offset: number, slope: number): number {
    function weightedTanhDerivSum(x: number): [number, number] {
        let s = 0;
        let sp = 0;
        for (const tanhTerm of allTanhTerms) {
            const tanhZ = Math.tanh((x - tanhTerm.mu) * tanhTerm.wArg);
            s += tanhZ * tanhTerm.wOut;
            sp += (1.0 - tanhZ * tanhZ) * tanhTerm.wArg * tanhTerm.wOut;
        }
        return [s + offset + slope * x, sp + slope];
    }

    return solveNewton(BOUNDS, weightedTanhDerivSum);
}