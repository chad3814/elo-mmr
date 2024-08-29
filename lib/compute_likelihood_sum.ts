import { TanhTerm } from "./tanh_term";

function evalLess(term: TanhTerm, x: number): [number, number] {
    const [val, valPrime] = term.baseValues(x);
    return [val - term.wOut, valPrime];
}

function evalGreater(term: TanhTerm, x: number): [number, number] {
    const [val, valPrime] = term.baseValues(x);
    return [val + term.wOut, valPrime];
}

function evalEqual(term: TanhTerm, x: number, mult: 1 | 2): [number, number] {
    const [val, valPrime] = term.baseValues(x);
    return [mult * val, mult * valPrime];
}

export function computeLikelihoodSum(x: number, tahnTerms: TanhTerm[], low: number, high: number, mult: 1 | 2): [number, number] {
    const itr: [number, number][] = [];
    for (let i = 0; i < tahnTerms.length; i++) {
        if (i < low) {
            itr.push(evalLess(tahnTerms[i], x));
        }
        if (i >= low && i <= high) {
            itr.push(evalEqual(tahnTerms[i], x, mult));
        }
        if (i >= (high + 1)) {
            itr.push(evalGreater(tahnTerms[i], x));
        }
    }
    return itr.reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1]], [0, 0]);
}
