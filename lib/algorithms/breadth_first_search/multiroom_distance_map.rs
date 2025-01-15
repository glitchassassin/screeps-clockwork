use crate::algorithms::map::neighbors;
use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::RoomDataCache;
use crate::utils::set_panic_hook;
use screeps::Position;
use screeps::RoomName;
use std::collections::HashSet;
use std::collections::VecDeque;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

#[derive(Copy, Clone)]
struct State {
    position: Position,
    room_key: usize,
}

/// Creates a distance map for the given start positions, using a breadth-first search.
/// This does not factor in terrain costs (treating anything less than 255 in the cost
/// matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
///
/// This calculates a distance map across multiple rooms, up to a maximum number of
/// tiles or rooms (in Manhattan distance).
///
/// # Arguments
/// * `start` - The starting position(s)
/// * `get_cost_matrix` - Function that returns the cost matrix for a given room
/// * `max_tiles` - Maximum number of tiles to explore
/// * `max_rooms` - Maximum number of rooms to explore
/// * `max_room_distance` - Maximum Manhattan distance in rooms to explore
/// * `max_tile_distance` - Maximum distance in tiles to explore
/// * `any_of_destinations` - Search exits early if any of these positions are reached
/// * `all_of_destinations` - Search exits early when all of these positions are reached
///
/// # Returns
/// A `MultiroomDistanceMap` containing the distances from the start positions
pub fn bfs_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_tiles: usize,
    max_rooms: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<Position>>,
    all_of_destinations: Option<Vec<Position>>,
) -> MultiroomDistanceMap {
    set_panic_hook();
    let mut frontier = VecDeque::new();
    let mut visited = start.iter().cloned().collect::<HashSet<_>>();
    let any_of_destinations =
        any_of_destinations.map(|d| d.iter().cloned().collect::<HashSet<_>>());
    let mut all_of_destinations =
        all_of_destinations.map(|d| d.iter().cloned().collect::<HashSet<_>>());
    let mut cached_room_data = RoomDataCache::new(max_rooms, get_cost_matrix);

    // Initialize with start positions
    for position in start {
        let room_key = cached_room_data.get_room_key(position.room_name());
        if let Some(room_key) = room_key {
            cached_room_data[room_key].distance_map[position.xy()] = 0;
            frontier.push_back(State { position, room_key });
        }
    }

    while let Some(State { position, room_key }) = frontier.pop_front() {
        let current_distance = cached_room_data[room_key].distance_map[position.xy()];

        if current_distance >= max_tile_distance {
            continue;
        }

        for neighbor in neighbors(position).into_iter() {
            let neighbor_room_key = match cached_room_data.get_room_key(neighbor.room_name()) {
                Some(key) => key,
                None => continue,
            };

            let cost = if let Some(matrix) = &cached_room_data[neighbor_room_key].cost_matrix {
                matrix.get_internal().get(neighbor.xy())
            } else {
                continue;
            };

            if cost < 255 && !visited.contains(&neighbor) {
                cached_room_data[neighbor_room_key].distance_map[neighbor.xy()] =
                    current_distance + 1;
                frontier.push_back(State {
                    position: neighbor,
                    room_key: neighbor_room_key,
                });
                visited.insert(neighbor);
                if let Some(ref mut all_of_destinations) = all_of_destinations {
                    all_of_destinations.remove(&neighbor);
                    if all_of_destinations.is_empty() {
                        return cached_room_data.into(); // early exit if all of the destinations are reached
                    }
                }
                if let Some(ref any_of_destinations) = any_of_destinations {
                    if any_of_destinations.contains(&neighbor) {
                        return cached_room_data.into(); // early exit if any of the destinations are reached
                    }
                }
            }

            if visited.len() >= max_tiles {
                return cached_room_data.into();
            }
        }
    }

    cached_room_data.into()
}

/// WASM wrapper for the BFS multiroom distance map function.
///
/// # Arguments
/// * `start_packed` - Array of packed position integers representing start positions
/// * `get_cost_matrix` - JavaScript function that returns cost matrices for rooms
/// * `max_tiles` - Maximum number of tiles to explore
/// * `max_rooms` - Maximum number of rooms to explore
/// * `max_room_distance` - Maximum Manhattan distance in rooms to explore
/// * `max_tile_distance` - Maximum distance in tiles to explore
/// * `any_of_destinations` - Array of packed positions to trigger early exit when any are reached
/// * `all_of_destinations` - Array of packed positions to trigger early exit when all are reached
///
/// # Returns
/// A `MultiroomDistanceMap` containing the distances from the start positions
#[wasm_bindgen]
pub fn js_bfs_multiroom_distance_map(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_tiles: usize,
    max_rooms: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<u32>>,
    all_of_destinations: Option<Vec<u32>>,
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
        max_tile_distance,
        any_of_destinations
            .and_then(|d| Some(d.iter().map(|pos| Position::from_packed(*pos)).collect())),
        all_of_destinations
            .and_then(|d| Some(d.iter().map(|pos| Position::from_packed(*pos)).collect())),
    )
}
