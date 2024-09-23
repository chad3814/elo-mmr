export type SolveNewtonIterator = (x: number) => [number, number];

export function solveNewton([low, high]: [number, number], iterator: SolveNewtonIterator): number {
    let guess = 0.5 * (low + high);
    while (true) {
        const [sum, sumPrime] = iterator(guess);
        const extrapolate = guess - sum / sumPrime;
        if (extrapolate < guess) {
            high = guess;
            guess = Math.max(extrapolate, high - 0.75 * (high - low));
        } else {
            low = guess;
            guess = Math.min(extrapolate, low + 0.75 * (high - low));
        }

        if (low >= guess || guess >= high) {
            if (Math.abs(sum) > 1e-10) {
                // possible failure to converge
                console.error('possible failure to converge');
            }
            return guess;
        }
    }
}
