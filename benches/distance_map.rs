use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use screeps_clockwork::bench_support::{
    astar_multiroom_distance_map, base_heuristic_with_range, dijkstra_multiroom_distance_map,
};

mod fixtures;

use fixtures::DistanceMapScenario;

fn bench_dijkstra_vs_astar(c: &mut Criterion) {
    let scenarios = fixtures::distance_map_scenarios();
    let mut group = c.benchmark_group("distance_map/dijkstra_vs_astar");

    for scenario in &scenarios {
        group.bench_with_input(
            BenchmarkId::new("dijkstra", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_dijkstra(scenario)));
            },
        );

        group.bench_with_input(
            BenchmarkId::new("astar", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_astar(scenario)));
            },
        );
    }

    group.finish();
}

fn run_dijkstra(scenario: &DistanceMapScenario) -> usize {
    let targets = scenario.targets();
    let result = black_box(dijkstra_multiroom_distance_map(
        vec![black_box(scenario.start)],
        |room| scenario.cost_matrix(room),
        scenario.max_ops,
        scenario.max_rooms,
        scenario.max_path_cost,
        Some(targets),
        None,
    ));
    result.ops()
}

fn run_astar(scenario: &DistanceMapScenario) -> usize {
    let targets = scenario.targets();
    let heuristic = base_heuristic_with_range(&targets);
    let result = black_box(astar_multiroom_distance_map(
        vec![black_box(scenario.start)],
        |room| scenario.cost_matrix(room),
        scenario.max_rooms,
        scenario.max_ops,
        scenario.max_path_cost,
        heuristic,
        Some(targets.clone()),
        None,
    ));
    result.ops()
}

criterion_group!(benches, bench_dijkstra_vs_astar);
criterion_main!(benches);
