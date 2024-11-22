# Testing Strategy

Tests ought to catch bugs quickly with minimal effort. In general, unit tests are fast to run, while integration and e2e tests are slower. However, unit tests cover less of the codebase.

For Clockwork, we've opted to rely heavily on integration and e2e tests. This means more thorough coverage with fewer tests written.

## Integration Tests

The test-bot project has a custom test runner, approximately modeled after jest, intended to be run on a Screeps private server. After a code push/global reset, the tests run automatically, pausing each tick after a CPU threshold has been reached and resuming on the following tick.

Integration tests are intended to run and either pass or fail within the space of a single tick. If an error is thrown, or the individual test times out, the test fails.

Some of these integration tests also time the Clockwork code vs. a Javascript reference implementation to guarantee that we're actually making things better.

## Visualizations

The test-bot project also has visualization logic, triggered by placing different-colored flags.

For more details, see the visualizations section of [the API docs](https://glitchassassin.github.io/screeps-clockwork/api/).
