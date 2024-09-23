from elommr import EloMMR, Player
from datetime import datetime, timezone

def main():
    elo_mmr = EloMMR()
    player1 = Player()
    player2 = Player()
    standings = [
        (
            player1,
            0, 0  # Range of players that got or tied for first
        ),
        (
            player2,
            1, 1  # Range of players that got or tied for second
        ),
    ]

    # Note that the contest_time does not do anything in this example
    # because EloMMR.drift_per_sec defaults to 0, so contest_time
    # can be omitted from the round_update call, but it is included
    # here to show how it can be used.
    # Do note, though, that you should either always include
    # contest_time or never include it, because if you include it
    # in some competitions and not others, the ratings will be skewed
    # incorrectly.
    contest_time = round(datetime.now(timezone.utc).timestamp())
    elo_mmr.round_update(standings, contest_time)

    contest_time += 1000
    # Assumes the outcome of the next competition is the same as the
    # previous, so the standings aren't changed.
    elo_mmr.round_update(standings, contest_time)

    for player in [player1, player2]:
        print("\nrating_mu, rating_sig, perf_score, place")
        for event in player.event_history:
            print(f"{event.mu}, {event.sig}, {event.perf_score}, {event.place}")
        print(f"Final rating: {player.event_history[-1].display_rating()}")

    # >>>
    # rating_mu, rating_sig, perf_score, place
    # 1629, 171, 1654, 0
    # 1645, 130, 1663, 0
    # Final rating: 1645 ± 100
    #
    # rating_mu, rating_sig, perf_score, place
    # 1371, 171, 1346, 1
    # 1355, 130, 1337, 1
    # Final rating: 1355 ± 100

if __name__ == '__main__':
    main()
