use crate::algorithms::map::manhattan_distance;
use crate::algorithms::map::neighbors;
use crate::cost_matrix::ClockworkCostMatrix;
use crate::datatypes::MultiroomDistanceMap;
use crate::utils::set_panic_hook;
use screeps::Position;
use screeps::RoomName;
use std::collections::HashMap;
use std::collections::HashSet;
use std::collections::VecDeque;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

/// Creates a distance map for the given start positions, using a breadth-first search.
/// This does not factor in terrain costs (treating anything less than 255 in the cost
/// matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
///
/// This calculates a distance map across multiple rooms, up to a maximum number of
/// tiles or rooms (in Manhattan distance).
pub fn bfs_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
) -> MultiroomDistanceMap {
    set_panic_hook();
    // Initialize the frontier with the passable positions surrounding the start positions
    let origin_rooms = start.iter().map(|p| p.room_name()).collect::<HashSet<_>>();
    let mut frontier = VecDeque::from(start.clone());
    let mut visited = start.iter().cloned().collect::<HashSet<_>>();
    let mut multiroom_distance_map = MultiroomDistanceMap::new();
    let mut cost_matrices = HashMap::new();

    // initialize the distance map with the start positions
    for position in start {
        multiroom_distance_map.get_or_create_room_map(position.room_name())[position.xy()] = 0;
    }

    while let Some(position) = frontier.pop_front() {
        let current_distance =
            multiroom_distance_map.get_or_create_room_map(position.room_name())[position.xy()];
        if current_distance >= max_tile_distance {
            // with breadth-first search, the distance map already represents the tile distance
            continue;
        }
        for neighbor in neighbors(position).into_iter() {
            let room_name = neighbor.room_name();
            let cost_matrix = if let Some(matrix) = cost_matrices.get(&room_name) {
                // matrix already exists
                matrix
            } else if cost_matrices.len() >= max_rooms
                || origin_rooms
                    .iter()
                    .all(|room| manhattan_distance(room, &room_name) > max_room_distance)
            {
                // we've reached the max number of rooms
                continue;
            } else if let Some(matrix) = get_cost_matrix(neighbor.room_name()) {
                // matrix doesn't exist, so we need to get it
                cost_matrices.insert(neighbor.room_name(), matrix);
                cost_matrices.get(&neighbor.room_name()).unwrap()
            } else {
                continue;
            };

            let cost = cost_matrix.get_internal().get(neighbor.xy());

            if cost < 255 && !visited.contains(&neighbor) {
                multiroom_distance_map.get_or_create_room_map(neighbor.room_name())
                    [neighbor.xy()] = current_distance + 1;
                frontier.push_back(neighbor);
                visited.insert(neighbor);
            } else {
                visited.insert(neighbor);
            }
        }
        if visited.len() >= max_tiles {
            break;
        }
    }

    multiroom_distance_map
}

/// WASM wrapper for the BFS multiroom distance map function.
#[wasm_bindgen]
pub fn js_bfs_multiroom_distance_map(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
) -> MultiroomDistanceMap {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();
    bfs_multiroom_distance_map(
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
        max_tiles,
        max_rooms,
        max_room_distance,
        max_tile_distance,
    )
}
