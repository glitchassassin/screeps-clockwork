use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use screeps::Position;
use screeps_clockwork::bench_support::{
    astar_multiroom_distance_map, astar_portal_multiroom_distance_map, base_heuristic_with_range,
    bfs_multiroom_distance_map, bfs_portal_multiroom_distance_map,
    closest_portal_heuristic_cached_with_range, dijkstra_multiroom_distance_map,
    dijkstra_portal_multiroom_distance_map, multiroom_flow_field, multiroom_mono_flow_field,
    path_to_multiroom_distance_map_origin, path_to_multiroom_flow_field_origin,
    path_to_multiroom_mono_flow_field_origin, DirectionOrder, MultiroomDistanceMap,
    MultiroomFlowField, MultiroomMonoFlowField,
};

mod fixtures;

use fixtures::{DistanceMapScenario, PortalDistanceMapScenario};

struct DerivedScenario {
    name: &'static str,
    path_start: Position,
    distance_map: MultiroomDistanceMap,
    flow_field: MultiroomFlowField,
    mono_flow_field: MultiroomMonoFlowField,
}

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

fn bench_bfs(c: &mut Criterion) {
    let scenarios = fixtures::distance_map_scenarios();
    let mut group = c.benchmark_group("distance_map/bfs");

    for scenario in &scenarios {
        group.bench_with_input(
            BenchmarkId::new("bfs", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_bfs(scenario)));
            },
        );
    }

    group.finish();
}

fn bench_portal_variants(c: &mut Criterion) {
    let scenarios = fixtures::portal_distance_map_scenarios();
    let mut group = c.benchmark_group("distance_map/portal_variants");

    for scenario in &scenarios {
        group.bench_with_input(
            BenchmarkId::new("portal_bfs", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_portal_bfs(scenario)));
            },
        );

        group.bench_with_input(
            BenchmarkId::new("portal_dijkstra", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_portal_dijkstra(scenario)));
            },
        );

        group.bench_with_input(
            BenchmarkId::new("portal_astar_cached", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_portal_astar_cached(scenario)));
            },
        );
    }

    group.finish();
}

fn bench_astar_vs_portal_astar(c: &mut Criterion) {
    let scenarios = fixtures::portal_distance_map_scenarios();
    let mut group = c.benchmark_group("distance_map/astar_vs_portal_astar");

    for scenario in &scenarios {
        group.bench_with_input(
            BenchmarkId::new("astar", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_astar_for_portal_scenario(scenario)));
            },
        );

        group.bench_with_input(
            BenchmarkId::new("portal_astar_cached", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| black_box(run_portal_astar_cached(scenario)));
            },
        );
    }

    group.finish();
}

fn bench_flow_fields(c: &mut Criterion) {
    let scenarios = derived_scenarios();
    let mut group = c.benchmark_group("flow_field");

    for scenario in &scenarios {
        group.bench_with_input(
            BenchmarkId::new("multiroom_flow_field", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| {
                    black_box(multiroom_flow_field(
                        black_box(&scenario.distance_map),
                        DirectionOrder::CardinalFirst,
                    ))
                });
            },
        );

        group.bench_with_input(
            BenchmarkId::new("multiroom_mono_flow_field", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| {
                    black_box(multiroom_mono_flow_field(
                        black_box(&scenario.distance_map),
                        DirectionOrder::CardinalFirst,
                    ))
                });
            },
        );
    }

    group.finish();
}

fn bench_paths(c: &mut Criterion) {
    let scenarios = derived_scenarios();
    let mut group = c.benchmark_group("path");

    for scenario in &scenarios {
        group.bench_with_input(
            BenchmarkId::new("distance_map_origin", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| {
                    black_box(
                        path_to_multiroom_distance_map_origin(
                            black_box(scenario.path_start),
                            black_box(&scenario.distance_map),
                            DirectionOrder::CardinalFirst,
                        )
                        .unwrap()
                        .len(),
                    )
                });
            },
        );

        group.bench_with_input(
            BenchmarkId::new("flow_field_origin", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| {
                    black_box(
                        path_to_multiroom_flow_field_origin(
                            black_box(scenario.path_start),
                            black_box(&scenario.flow_field),
                        )
                        .unwrap()
                        .len(),
                    )
                });
            },
        );

        group.bench_with_input(
            BenchmarkId::new("mono_flow_field_origin", scenario.name),
            scenario,
            |bench, scenario| {
                bench.iter(|| {
                    black_box(
                        path_to_multiroom_mono_flow_field_origin(
                            black_box(scenario.path_start),
                            black_box(&scenario.mono_flow_field),
                        )
                        .unwrap()
                        .len(),
                    )
                });
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

fn run_bfs(scenario: &DistanceMapScenario) -> usize {
    let targets = scenario.targets();
    let result = black_box(bfs_multiroom_distance_map(
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

fn run_astar_for_portal_scenario(scenario: &PortalDistanceMapScenario) -> usize {
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

fn run_portal_astar_cached(scenario: &PortalDistanceMapScenario) -> usize {
    let targets = scenario.targets();
    let heuristic = closest_portal_heuristic_cached_with_range(&targets, &scenario.portal_index);
    let result = black_box(astar_portal_multiroom_distance_map(
        vec![black_box(scenario.start)],
        |room| scenario.cost_matrix(room),
        scenario.max_rooms,
        scenario.max_ops,
        scenario.max_path_cost,
        heuristic,
        &scenario.portal_index,
        Some(targets.clone()),
        None,
    ));
    result.ops()
}

fn run_portal_dijkstra(scenario: &PortalDistanceMapScenario) -> usize {
    let targets = scenario.targets();
    let result = black_box(dijkstra_portal_multiroom_distance_map(
        vec![black_box(scenario.start)],
        |room| scenario.cost_matrix(room),
        scenario.max_ops,
        scenario.max_rooms,
        scenario.max_path_cost,
        &scenario.portal_index,
        Some(targets),
        None,
    ));
    result.ops()
}

fn run_portal_bfs(scenario: &PortalDistanceMapScenario) -> usize {
    let targets = scenario.targets();
    let result = black_box(bfs_portal_multiroom_distance_map(
        vec![black_box(scenario.start)],
        |room| scenario.cost_matrix(room),
        scenario.max_ops,
        scenario.max_rooms,
        scenario.max_path_cost,
        &scenario.portal_index,
        Some(targets),
        None,
    ));
    result.ops()
}

fn derived_scenarios() -> Vec<DerivedScenario> {
    fixtures::distance_map_scenarios()
        .into_iter()
        .map(|scenario| {
            let targets = scenario.targets();
            let result = bfs_multiroom_distance_map(
                vec![scenario.start],
                |room| scenario.cost_matrix(room),
                scenario.max_ops,
                scenario.max_rooms,
                scenario.max_path_cost,
                Some(targets),
                None,
            );
            let path_start = result
                .found_targets()
                .first()
                .map(|packed| Position::from_packed(*packed))
                .unwrap_or(scenario.target);
            let distance_map = result.distance_map();
            let flow_field = multiroom_flow_field(&distance_map, DirectionOrder::CardinalFirst);
            let mono_flow_field =
                multiroom_mono_flow_field(&distance_map, DirectionOrder::CardinalFirst);

            DerivedScenario {
                name: scenario.name,
                path_start,
                distance_map,
                flow_field,
                mono_flow_field,
            }
        })
        .collect()
}

criterion_group!(
    benches,
    bench_dijkstra_vs_astar,
    bench_bfs,
    bench_portal_variants,
    bench_astar_vs_portal_astar,
    bench_flow_fields,
    bench_paths
);
criterion_main!(benches);
