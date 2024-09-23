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
/*
    itr1 = (eval_less(term, x) for term in tanh_terms[:lo])
    itr2 = (eval_equal(term, x, mul) for term in tanh_terms[lo : hi + 1])
    itr3 = (eval_greater(term, x) for term in tanh_terms[hi + 1 :])
    ret = reduce(
        lambda acc, v: (acc[0] + v[0], acc[1] + v[1]), chain(itr1, itr2, itr3), (0, 0)
    )
 */

    const itr1 = tahnTerms.slice(0, low).map(
        tanhTerm => evalLess(tanhTerm, x)
    );
    const itr2 = tahnTerms.slice(low, high + 1).map(
        tanhTerm => evalEqual(tanhTerm, x, mult)
    );
    const itr3 = tahnTerms.slice(high + 1).map(
        tanhTerm => evalGreater(tanhTerm, x)
    );
    const ret = [...itr1, ...itr2, ...itr3].reduce((acc, v) => [acc[0] + v[0], acc[1] + v[1]], [0, 0]);
    return ret;
}
