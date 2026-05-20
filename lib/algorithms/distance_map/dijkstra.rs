use crate::algorithms::distance_map::astar::astar_multiroom_distance_map;
use crate::algorithms::distance_map::astar::astar_portal_multiroom_distance_map;
use crate::datatypes::with_configured_portal_index;
use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::PortalIndex;
use crate::utils::set_panic_hook;
use screeps::Position;
use screeps::RoomName;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

use super::SearchResult;

pub fn dijkstra_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_ops: usize,
    max_rooms: usize,
    max_path_cost: usize,
    any_of_destinations: Option<Vec<(Position, usize)>>,
    all_of_destinations: Option<Vec<(Position, usize)>>,
) -> SearchResult {
    set_panic_hook();

    astar_multiroom_distance_map(
        start,
        get_cost_matrix,
        max_rooms,
        max_ops,
        max_path_cost,
        // Only difference between Dijkstra's algorithm and A* is the heuristic function
        // So, Dijkstra's is just A* with a heuristic of 0
        |_| 0,
        any_of_destinations,
        all_of_destinations,
    )
}

#[allow(clippy::too_many_arguments)]
pub fn dijkstra_portal_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_ops: usize,
    max_rooms: usize,
    max_path_cost: usize,
    portal_index: &PortalIndex,
    any_of_destinations: Option<Vec<(Position, usize)>>,
    all_of_destinations: Option<Vec<(Position, usize)>>,
) -> SearchResult {
    set_panic_hook();

    astar_portal_multiroom_distance_map(
        start,
        get_cost_matrix,
        max_rooms,
        max_ops,
        max_path_cost,
        |_| 0,
        portal_index,
        any_of_destinations,
        all_of_destinations,
    )
}

#[wasm_bindgen]
pub fn js_dijkstra_multiroom_distance_map(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_ops: usize,
    max_rooms: usize,
    max_path_cost: usize,
    any_of_destinations: Option<Vec<u32>>,
    all_of_destinations: Option<Vec<u32>>,
) -> SearchResult {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();

    let any_of_destinations: Option<Vec<(Position, usize)>> =
        any_of_destinations.map(|destinations| {
            destinations
                .chunks(2)
                .map(|chunk| (Position::from_packed(chunk[0]), chunk[1] as usize))
                .collect()
        });

    let all_of_destinations: Option<Vec<(Position, usize)>> =
        all_of_destinations.map(|destinations| {
            destinations
                .chunks(2)
                .map(|chunk| (Position::from_packed(chunk[0]), chunk[1] as usize))
                .collect()
        });

    dijkstra_multiroom_distance_map(
        start_positions,
        |room| {
            let result = get_cost_matrix.call1(
                &JsValue::null(),
                &JsValue::from_f64(room.packed_repr() as f64),
            );

            let value = match result {
                Ok(value) => value,
                Err(e) => throw_val(e),
            };

            if value.is_undefined() {
                None
            } else {
                Some(
                    ClockworkCostMatrix::try_from(value)
                        .ok()
                        .expect_throw("Invalid ClockworkCostMatrix"),
                )
            }
        },
        max_ops,
        max_rooms,
        max_path_cost,
        any_of_destinations,
        all_of_destinations,
    )
}

#[wasm_bindgen]
pub fn js_dijkstra_portal_multiroom_distance_map(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_ops: usize,
    max_rooms: usize,
    max_path_cost: usize,
    any_of_destinations: Option<Vec<u32>>,
    all_of_destinations: Option<Vec<u32>>,
) -> SearchResult {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();

    let any_of_destinations: Option<Vec<(Position, usize)>> =
        any_of_destinations.map(|destinations| {
            destinations
                .chunks(2)
                .map(|chunk| (Position::from_packed(chunk[0]), chunk[1] as usize))
                .collect()
        });

    let all_of_destinations: Option<Vec<(Position, usize)>> =
        all_of_destinations.map(|destinations| {
            destinations
                .chunks(2)
                .map(|chunk| (Position::from_packed(chunk[0]), chunk[1] as usize))
                .collect()
        });

    with_configured_portal_index(|portal_index| {
        dijkstra_portal_multiroom_distance_map(
            start_positions,
            |room| {
                let result = get_cost_matrix.call1(
                    &JsValue::null(),
                    &JsValue::from_f64(room.packed_repr() as f64),
                );

                let value = match result {
                    Ok(value) => value,
                    Err(e) => throw_val(e),
                };

                if value.is_undefined() {
                    None
                } else {
                    Some(
                        ClockworkCostMatrix::try_from(value)
                            .ok()
                            .expect_throw("Invalid ClockworkCostMatrix"),
                    )
                }
            },
            max_ops,
            max_rooms,
            max_path_cost,
            portal_index,
            any_of_destinations,
            all_of_destinations,
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::algorithms::distance_map::astar::astar_portal_multiroom_distance_map;
    use crate::algorithms::distance_map::heuristics::closest_portal_heuristic_cached_with_range;
    use crate::algorithms::flow_field::multiroom_flow_field::multiroom_portal_flow_field_with_index;
    use crate::algorithms::flow_field::multiroom_mono_flow_field::multiroom_portal_mono_flow_field_with_index;
    use crate::algorithms::map::DirectionOrder;
    use crate::algorithms::path::to_multiroom_distance_map_origin::path_to_multiroom_distance_map_origin_with_portals;
    use crate::algorithms::path::to_multiroom_flow_field_origin::path_to_multiroom_flow_field_origin_with_portals;
    use crate::algorithms::path::to_multiroom_mono_flow_field_origin::path_to_multiroom_mono_flow_field_origin_with_portals;
    use screeps::{Direction, RoomCoordinate, RoomName};
    use std::collections::HashMap;

    fn room(name: &str) -> RoomName {
        name.parse().unwrap()
    }

    fn pos(room_name: &str, x: u8, y: u8) -> Position {
        Position::new(
            RoomCoordinate::new(x).unwrap(),
            RoomCoordinate::new(y).unwrap(),
            room(room_name),
        )
    }

    fn plain_matrix() -> ClockworkCostMatrix {
        ClockworkCostMatrix::new(Some(1))
    }

    fn callback(
        matrices: HashMap<RoomName, ClockworkCostMatrix>,
    ) -> impl Fn(RoomName) -> Option<ClockworkCostMatrix> {
        move |room| matrices.get(&room).cloned()
    }

    fn portal_index() -> PortalIndex {
        let mut portals = PortalIndex::default();
        portals.add_bidirectional(pos("W1N1", 10, 10), pos("W5N1", 10, 10));
        portals
    }

    #[test]
    fn portal_search_charges_the_entrance_tile() {
        let start = pos("W1N1", 9, 10);
        let portal_entry = pos("W1N1", 10, 10);
        let target = pos("W5N1", 12, 10);
        let portals = portal_index();

        let mut origin_matrix = plain_matrix();
        origin_matrix.set(portal_entry.xy(), 9);

        let matrices = HashMap::from([
            (room("W1N1"), origin_matrix),
            (room("W5N1"), plain_matrix()),
        ]);

        let result = dijkstra_portal_multiroom_distance_map(
            vec![start],
            callback(matrices),
            10_000,
            2,
            10_000,
            &portals,
            Some(vec![(target, 0)]),
            None,
        );

        let distance_map = result.distance_map();
        assert_eq!(
            distance_map.get(target),
            11,
            "portal exit {}, step {}, target {}",
            distance_map.get(pos("W5N1", 10, 10)),
            distance_map.get(pos("W5N1", 11, 10)),
            distance_map.get(target)
        );
        assert_eq!(result.found_targets, vec![target]);
    }

    #[test]
    fn astar_portal_search_matches_portal_dijkstra() {
        let start = pos("W1N1", 9, 10);
        let target = pos("W5N1", 12, 10);
        let portals = portal_index();
        let goals = vec![(target, 0)];

        let matrices = HashMap::from([
            (room("W1N1"), plain_matrix()),
            (room("W5N1"), plain_matrix()),
        ]);
        let dijkstra = dijkstra_portal_multiroom_distance_map(
            vec![start],
            callback(matrices.clone()),
            10_000,
            2,
            100,
            &portals,
            Some(goals.clone()),
            None,
        );
        let heuristic = closest_portal_heuristic_cached_with_range(&goals, &portals);
        let astar = astar_portal_multiroom_distance_map(
            vec![start],
            callback(matrices),
            2,
            100,
            100,
            heuristic,
            &portals,
            Some(goals.clone()),
            None,
        );

        assert_eq!(
            astar.distance_map().get(target),
            dijkstra.distance_map().get(target)
        );
        assert_eq!(astar.found_targets, dijkstra.found_targets);
    }

    #[test]
    fn portal_path_includes_entrance_and_exit_tiles() {
        let start = pos("W1N1", 9, 10);
        let portal_entry = pos("W1N1", 10, 10);
        let portal_exit = pos("W5N1", 10, 10);
        let step_after_exit = pos("W5N1", 11, 10);
        let target = pos("W5N1", 12, 10);
        let portals = portal_index();

        let matrices = HashMap::from([
            (room("W1N1"), plain_matrix()),
            (room("W5N1"), plain_matrix()),
        ]);

        let distance_map = dijkstra_portal_multiroom_distance_map(
            vec![target],
            callback(matrices),
            1_000,
            2,
            100,
            &portals,
            None,
            None,
        )
        .distance_map();

        let path = path_to_multiroom_distance_map_origin_with_portals(
            start,
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        )
        .unwrap();

        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(
            actual,
            vec![start, portal_entry, portal_exit, step_after_exit, target]
        );

        let path = path_to_multiroom_distance_map_origin_with_portals(
            portal_entry,
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        )
        .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(
            actual,
            vec![portal_entry, portal_exit, step_after_exit, target]
        );
    }

    #[test]
    fn portal_path_reconstructs_no_portal_room_exits() {
        let start = pos("W1N2", 5, 5);
        let target = pos("W2N2", 5, 5);
        let portals = PortalIndex::default();

        let matrices = HashMap::from([
            (room("W1N2"), plain_matrix()),
            (room("W2N2"), plain_matrix()),
        ]);

        let distance_map = dijkstra_portal_multiroom_distance_map(
            vec![start],
            callback(matrices),
            10_000,
            2,
            100,
            &portals,
            Some(vec![(target, 0)]),
            None,
        )
        .distance_map();

        let path = path_to_multiroom_distance_map_origin_with_portals(
            target,
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        )
        .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();

        assert_eq!(actual.first(), Some(&target));
        assert_eq!(actual.last(), Some(&start));
        assert!(actual.windows(2).any(|window| {
            window[0].room_name() != window[1].room_name()
                && crate::algorithms::map::corresponding_room_edge(window[0]) == window[1]
        }));
    }

    #[test]
    fn portal_path_stops_when_origin_is_room_exit() {
        let start = pos("W1N1", 47, 10);
        let step_before_origin = pos("W1N1", 48, 10);
        let origin = pos("W1N1", 49, 10);
        let portals = PortalIndex::default();

        let matrices = HashMap::from([(room("W1N1"), plain_matrix())]);

        let distance_map = dijkstra_portal_multiroom_distance_map(
            vec![origin],
            callback(matrices),
            1_000,
            1,
            100,
            &portals,
            None,
            None,
        )
        .distance_map();

        let expected = vec![start, step_before_origin, origin];

        let path = path_to_multiroom_distance_map_origin_with_portals(
            start,
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        )
        .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(actual, expected);

        let path = path_to_multiroom_distance_map_origin_with_portals(
            origin,
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        )
        .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(actual, vec![origin]);

        let flow_field = multiroom_portal_flow_field_with_index(
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        );
        let path =
            path_to_multiroom_flow_field_origin_with_portals(start, &flow_field, &portals).unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(actual, expected);

        let path = path_to_multiroom_flow_field_origin_with_portals(origin, &flow_field, &portals)
            .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(actual, vec![origin]);

        let mono_flow_field = multiroom_portal_mono_flow_field_with_index(
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        );
        let path = path_to_multiroom_mono_flow_field_origin_with_portals(
            start,
            &mono_flow_field,
            &portals,
        )
        .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(actual, expected);

        let path = path_to_multiroom_mono_flow_field_origin_with_portals(
            origin,
            &mono_flow_field,
            &portals,
        )
        .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();
        assert_eq!(actual, vec![origin]);
    }

    #[test]
    fn portal_flow_field_points_toward_the_portal_entrance() {
        let start = pos("W1N1", 9, 10);
        let portal_entry = pos("W1N1", 10, 10);
        let portal_exit = pos("W5N1", 10, 10);
        let step_after_exit = pos("W5N1", 11, 10);
        let target = pos("W5N1", 12, 10);
        let portals = portal_index();

        let matrices = HashMap::from([
            (room("W1N1"), plain_matrix()),
            (room("W5N1"), plain_matrix()),
        ]);

        let distance_map = dijkstra_portal_multiroom_distance_map(
            vec![target],
            callback(matrices),
            1_000,
            2,
            100,
            &portals,
            None,
            None,
        )
        .distance_map();
        let flow_field = multiroom_portal_flow_field_with_index(
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        );

        assert!(flow_field.get_directions(start).contains(&Direction::Right));

        let path =
            path_to_multiroom_flow_field_origin_with_portals(start, &flow_field, &portals).unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();

        assert_eq!(
            actual,
            vec![start, portal_entry, portal_exit, step_after_exit, target]
        );

        let path =
            path_to_multiroom_flow_field_origin_with_portals(portal_entry, &flow_field, &portals)
                .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();

        assert_eq!(
            actual,
            vec![portal_entry, portal_exit, step_after_exit, target]
        );

        let mono_flow_field = multiroom_portal_mono_flow_field_with_index(
            &distance_map,
            DirectionOrder::CardinalFirst,
            &portals,
        );
        let path = path_to_multiroom_mono_flow_field_origin_with_portals(
            portal_entry,
            &mono_flow_field,
            &portals,
        )
        .unwrap();
        let actual: Vec<Position> = (0..path.len()).map(|i| *path.get(i).unwrap()).collect();

        assert_eq!(
            actual,
            vec![portal_entry, portal_exit, step_after_exit, target]
        );
    }
}
