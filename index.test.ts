import { EloMmr, Standing } from "./lib/elo_mmr";
import { Player } from "./lib/player";
import { Rating } from "./lib/rating";

describe('Ratings', () => {
    test('should default to 1500/350', () => {
        expect(new Rating().mu).toBe(1500);
        expect(new Rating().sig).toBe(350);
    });
});

describe('Rounds', () => {
    test('two player game, winner should be higher', () => {
        const player1 = new Player(new Rating());
        const player2 = new Player(new Rating());
        const system = new EloMmr(true);
        const standings: Standing[] = [
            [player1, 0, 0],
            [player2, 1, 1],
        ];
        system.roundUpdate(standings, new Date());
        expect(player1.approximatePosterior.mu).toBeGreaterThan(player2.approximatePosterior.mu);
        expect(player1.approximatePosterior.sig).toBeLessThan(350);
        expect(player2.approximatePosterior.sig).toBeLessThan(350);
    })
})
