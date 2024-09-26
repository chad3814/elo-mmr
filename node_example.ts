import { EloMmr, Standing } from "./lib/elo_mmr"
import { Player } from "./lib/player";
import { Rating } from "./lib/rating";

function main(): void {
    const elo_mmr = new EloMmr();
    const player1 = new Player(new Rating());
    const player2 = new Player(new Rating())
    const standings: Standing[] = [
        [
            player1,
            0, 0  // Range of players that got or tied for first
        ],
        [
            player2,
            1, 1  // Range of players that got or tied for second
        ],
    ];

    // Note that the contest_time does not do anything in this example
    // because EloMMR.drift_per_sec defaults to 0, so contest_time
    // can be omitted from the round_update call, but it is included
    // here to show how it can be used.
    // Do note, though, that you should either always include
    // contest_time or never include it, because if you include it
    // in some competitions and not others, the ratings will be skewed
    // incorrectly.
    const contest_time = new Date();
    elo_mmr.roundUpdate(standings, contest_time);

    const next_contest_time = new Date(contest_time.getMilliseconds() + 10000);
    // Assumes the outcome of the next competition is the same as the
    // previous, so the standings aren't changed.
    elo_mmr.roundUpdate(standings, next_contest_time);

    for (const player of [player1, player2]) {
        console.log("\nrating_mu, rating_sig, perf_score, place");
        for(const event of player.eventHistory) {
            console.log(`${event.rating.mu}, ${event.rating.sig}, ${event.performanceScore}, ${event.place}`);
        }
        console.log(`Final rating: ${player.eventHistory[player.eventHistory.length - 1].toString()}`);
    }
    // >>>
    // rating_mu, rating_sig, perf_score, place
    // 1629, 171, 1654, 0
    // 1645, 130, 1663, 0
    // Final rating: 1645 ± 100
    //
    // rating_mu, rating_sig, perf_score, place
    // 1371, 171, 1346, 1
    // 1355, 130, 1337, 1
    // Final rating: 1355 ± 100
}

main();
