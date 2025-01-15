use crate::algorithms::map::{corresponding_room_edge, next_directions};
use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::MultiroomDistanceMap;
use crate::utils::set_panic_hook;
use screeps::Direction;
use screeps::Position;
use screeps::RoomName;
use std::collections::HashSet;
use std::convert::TryFrom;
use std::ops::Fn;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

use super::heuristics::range_heuristic;
use super::room_data_cache::RoomDataCache;

#[derive(Copy, Clone)]
struct State {
    // The cost to reach the current position.
    g_score: usize,
    // The current position.
    position: Position,
    // The direction from the previous position that led to the current position.
    open_direction: Option<Direction>,
    // The index of the position's room in the room data cache.
    room_key: usize,
}

/// Creates a distance map for the given start positions, using A* to optimize the search and
/// find the shortest path to the given destinations.
pub fn astar_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_tiles: usize,
    max_path_cost: usize,
    heuristic_fn: impl Fn(Position) -> usize,
    any_of_destinations: Option<Vec<Position>>,
    all_of_destinations: Option<Vec<Position>>,
) -> MultiroomDistanceMap {
    set_panic_hook();
    // Since we expect the total cost to be limited (path costs above 1500 rarely make sense),
    // we use a vec indexed by the f_score to store the open states rather than a proper priority queue.
    let mut open: Vec<Vec<State>> = vec![Default::default()];
    let mut min_idx = 0;
    // We use this to limit the search to the given number of tiles.
    let mut tiles_remaining = max_tiles;
    let mut cached_room_data = RoomDataCache::new(get_cost_matrix);
    let any_of_targets: HashSet<Position> = any_of_destinations
        .clone()
        .unwrap_or_default()
        .into_iter()
        .collect();
    let mut all_of_targets: HashSet<Position> = all_of_destinations
        .clone()
        .unwrap_or_default()
        .into_iter()
        .collect();

    // Initialize with start positions
    for position in start {
        let room_key = cached_room_data.get_room_key(position.room_name());
        open[0].push(State {
            g_score: 0,
            position,
            open_direction: None,
            room_key,
        });
        cached_room_data[room_key].distance_map[position.xy()] = 0;
        tiles_remaining -= 1;
    }

    // Loop through all open tiles, starting with the lowest f_score.
    while min_idx < open.len() {
        while let Some(State {
            g_score,
            position,
            open_direction,
            room_key,
        }) = open[min_idx].pop()
        {
            // Ignore paths that cost too much.
            if g_score >= max_path_cost {
                continue;
            }

            let current_room_name = cached_room_data[room_key].room_name;

            // Loop through relevant neighbors (not all directions can improve the path)
            for neighbor_direction in next_directions(open_direction) {
                // If neighbor would be a room edge, map it to the corresponding tile in
                // the other room, where the creep would be if it moved in that direction.
                let neighbor = corresponding_room_edge(
                    match position.checked_add_direction(*neighbor_direction) {
                        Ok(pos) => pos,
                        Err(_) => continue,
                    },
                );

                // Get the room index for the neighbor, if it's different from the current position.
                let room_key = if neighbor.room_name() == current_room_name {
                    room_key
                } else {
                    cached_room_data.get_room_key(neighbor.room_name())
                };

                // Look up the terrain cost for the neighboring position. If it's impassable,
                // or the entire cost matrix is blocked, skip this neighbor.
                let terrain_cost =
                    if let Some(cost_matrix) = &cached_room_data[room_key].cost_matrix {
                        let terrain_cost = cost_matrix.get(neighbor.xy());
                        if terrain_cost >= 255 {
                            // impassable terrain
                            continue;
                        }
                        terrain_cost
                    } else {
                        // no cost matrix means room is blocked
                        continue;
                    };

                // Calculate the cost of the path to the neighbor (from moving through the current position)
                let next_cost = g_score.saturating_add(terrain_cost as usize);

                // Skip this neighbor if we've already found a better path to it.
                if cached_room_data[room_key].distance_map[neighbor.xy()] <= next_cost {
                    // already visited and better path found
                    continue;
                }

                // Calculate the heuristic score for the neighbor.
                // This is the estimated cost to the goal from the neighbor.
                let h_score = heuristic_fn(neighbor);
                // The f_score is the sum of the cost to reach the neighbor and the heuristic score.
                let f_score = next_cost.saturating_add(h_score);

                // Ensure the open list has enough buckets to store the new state.
                open.resize(
                    open.len().max(f_score.saturating_add(1)),
                    Default::default(),
                );

                // Add the new state to the open list and update the distance map.
                open[f_score].push(State {
                    g_score: next_cost,
                    position: neighbor,
                    open_direction: Some(*neighbor_direction),
                    room_key,
                });
                cached_room_data[room_key].distance_map[neighbor.xy()] = next_cost;
                tiles_remaining -= 1;

                // if the f_score is lower than the current min_idx, update min_idx
                min_idx = min_idx.min(f_score);

                // check off targets as they are reached
                if all_of_destinations.is_some() {
                    all_of_targets.remove(&neighbor);
                }

                // If the goal is reached or the max number of tiles has been processed, return the distance map.
                if (any_of_destinations.is_some() && any_of_targets.contains(&neighbor))
                    || (all_of_destinations.is_some() && all_of_targets.is_empty())
                    || tiles_remaining == 0
                {
                    return cached_room_data.into();
                }
            }
        }
        // Move to the next bucket in the open list.
        min_idx += 1;
    }

    // If we've processed all tiles and haven't found the goal, return the distance map.
    cached_room_data.into()
}

#[wasm_bindgen]
pub fn js_astar_multiroom_distance_map(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_tiles: usize,
    max_path_cost: usize,
    // TODO: Destinations need to include a range
    any_of_destinations: Option<Vec<u32>>,
    all_of_destinations: Option<Vec<u32>>,
) -> MultiroomDistanceMap {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();

    let any_of_destinations: Option<Vec<Position>> = any_of_destinations.and_then(|destinations| {
        Some(
            destinations
                .iter()
                .map(|pos| Position::from_packed(*pos))
                .collect(),
        )
    });

    let all_of_destinations: Option<Vec<Position>> = all_of_destinations.and_then(|destinations| {
        Some(
            destinations
                .iter()
                .map(|pos| Position::from_packed(*pos))
                .collect(),
        )
    });

    let all_destinations: Vec<Position> = all_of_destinations
        .clone()
        .unwrap_or_default()
        .into_iter()
        .chain(any_of_destinations.clone().unwrap_or_default())
        .collect();

    let heuristic_fn = range_heuristic(&all_destinations);

    astar_multiroom_distance_map(
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

            let cost_matrix = if value.is_undefined() {
                None
            } else {
                Some(
                    ClockworkCostMatrix::try_from(value)
                        .ok()
                        .expect_throw("Invalid ClockworkCostMatrix"),
                )
            };

            cost_matrix
        },
        max_tiles,
        max_path_cost,
        heuristic_fn,
        any_of_destinations,
        all_of_destinations,
    )
}
