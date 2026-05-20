use crate::algorithms::map::{corresponding_room_edge, preferred_directions, same_room_neighbor};
use crate::algorithms::map::{neighbors, DirectionOrder};
use crate::datatypes::with_configured_portal_index;
use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::PortalIndex;
use crate::datatypes::RoomDataCache;
use crate::utils::set_panic_hook;
use screeps::Position;
use screeps::RoomName;
use std::collections::HashSet;
use std::collections::VecDeque;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

use super::SearchResult;

#[derive(Copy, Clone)]
struct State {
    g_score: usize,
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
/// * `max_ops` - Maximum number of pathfinding operations to perform
/// * `max_rooms` - Maximum number of rooms to explore
/// * `max_path_cost` - Maximum path cost to explore
/// * `any_of_destinations` - Search exits early if any of these positions are reached
/// * `all_of_destinations` - Search exits early when all of these positions are reached
///
/// # Returns
/// A `MultiroomDistanceMap` containing the distances from the start positions
pub fn bfs_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_ops: usize,
    max_rooms: usize,
    max_path_cost: usize,
    any_of_destinations: Option<Vec<(Position, usize)>>,
    all_of_destinations: Option<Vec<(Position, usize)>>,
) -> SearchResult {
    set_panic_hook();
    let mut frontier = VecDeque::new();
    let any_of_destinations =
        any_of_destinations.map(|d| d.iter().cloned().collect::<HashSet<_>>());
    let mut all_of_destinations =
        all_of_destinations.map(|d| d.iter().cloned().collect::<HashSet<_>>());
    let mut cached_room_data = RoomDataCache::new(max_rooms, get_cost_matrix);
    let mut ops_remaining = max_ops;
    let mut found_targets = Vec::new();

    // check if start position matches targets and return early if so
    for neighbor in start.iter() {
        if let Some(ref any_of_destinations) = any_of_destinations {
            if any_of_destinations.iter().any(|(target, range)| {
                target.room_name() == neighbor.room_name()
                    && target.get_range_to(*neighbor) <= *range as u32
            }) {
                found_targets.push(*neighbor);
                return SearchResult::new(
                    cached_room_data.into(),
                    found_targets,
                    max_ops - ops_remaining,
                );
            }
        }
        if let Some(ref mut all_of_destinations) = all_of_destinations {
            all_of_destinations.retain(|(target, range)| {
                if target.room_name() == neighbor.room_name()
                    && target.get_range_to(*neighbor) <= *range as u32
                {
                    found_targets.push(*neighbor);
                    false
                } else {
                    true
                }
            });
            if all_of_destinations.is_empty() {
                return SearchResult::new(
                    cached_room_data.into(),
                    found_targets,
                    max_ops - ops_remaining,
                );
            }
        }
    }

    // Initialize with start positions
    for position in start {
        let room_key = cached_room_data.get_room_key(position.room_name());
        if let Some(room_key) = room_key {
            cached_room_data[room_key].distance_map[position.xy()] = 0;
            frontier.push_back(State {
                g_score: 0,
                position,
                room_key,
            });
        }
    }

    while let Some(State {
        g_score,
        position,
        room_key,
    }) = frontier.pop_front()
    {
        if ops_remaining == 0 {
            return SearchResult::new(
                cached_room_data.into(),
                found_targets,
                max_ops - ops_remaining,
            );
        }
        ops_remaining -= 1;

        if g_score >= max_path_cost {
            continue;
        }

        for neighbor in neighbors(position, DirectionOrder::CardinalFirst) {
            let neighbor_room_key = if neighbor.room_name() == position.room_name() {
                room_key
            } else {
                match cached_room_data.get_room_key(neighbor.room_name()) {
                    Some(key) => key,
                    None => continue,
                }
            };

            // check for obstacle
            if !cached_room_data[neighbor_room_key]
                .cost_matrix
                .as_ref()
                .map(|matrix| {
                    let cost = matrix.get(neighbor.xy());
                    cost < 255
                })
                .unwrap_or(false)
            {
                continue;
            };

            let next_cost = g_score.saturating_add(1);

            // Skip this neighbor if we've already found a better path to it.
            if cached_room_data[neighbor_room_key].distance_map[neighbor.xy()] <= next_cost {
                // already visited and better path found
                continue;
            }

            cached_room_data[neighbor_room_key].distance_map[neighbor.xy()] = next_cost;
            frontier.push_back(State {
                g_score: next_cost,
                position: neighbor,
                room_key: neighbor_room_key,
            });
            if let Some(ref mut all_of_destinations) = all_of_destinations {
                all_of_destinations.retain(|(target, range)| {
                    if target.room_name() == neighbor.room_name()
                        && target.get_range_to(neighbor) <= *range as u32
                    {
                        found_targets.push(neighbor);
                        false
                    } else {
                        true
                    }
                });
                if all_of_destinations.is_empty() {
                    return SearchResult::new(
                        cached_room_data.into(),
                        found_targets,
                        max_ops - ops_remaining,
                    );
                }
            }
            if let Some(ref any_of_destinations) = any_of_destinations {
                if any_of_destinations.iter().any(|(target, range)| {
                    target.room_name() == neighbor.room_name()
                        && target.get_range_to(neighbor) <= *range as u32
                }) {
                    found_targets.push(neighbor);
                    return SearchResult::new(
                        cached_room_data.into(),
                        found_targets,
                        max_ops - ops_remaining,
                    );
                }
            }
        }
    }

    SearchResult::new(
        cached_room_data.into(),
        found_targets,
        max_ops - ops_remaining,
    )
}

#[allow(clippy::too_many_arguments)]
pub fn bfs_portal_multiroom_distance_map(
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
    let mut frontier = VecDeque::new();
    let any_of_destinations =
        any_of_destinations.map(|d| d.iter().cloned().collect::<HashSet<_>>());
    let mut all_of_destinations =
        all_of_destinations.map(|d| d.iter().cloned().collect::<HashSet<_>>());
    let mut cached_room_data = RoomDataCache::new(max_rooms, get_cost_matrix);
    let mut ops_remaining = max_ops;
    let mut found_targets = Vec::new();

    for neighbor in start.iter() {
        if let Some(ref any_of_destinations) = any_of_destinations {
            if any_of_destinations.iter().any(|(target, range)| {
                target.room_name() == neighbor.room_name()
                    && target.get_range_to(*neighbor) <= *range as u32
            }) {
                found_targets.push(*neighbor);
                return SearchResult::new(
                    cached_room_data.into(),
                    found_targets,
                    max_ops - ops_remaining,
                );
            }
        }
        if let Some(ref mut all_of_destinations) = all_of_destinations {
            all_of_destinations.retain(|(target, range)| {
                if target.room_name() == neighbor.room_name()
                    && target.get_range_to(*neighbor) <= *range as u32
                {
                    found_targets.push(*neighbor);
                    false
                } else {
                    true
                }
            });
            if all_of_destinations.is_empty() {
                return SearchResult::new(
                    cached_room_data.into(),
                    found_targets,
                    max_ops - ops_remaining,
                );
            }
        }
    }

    for position in start {
        let room_key = cached_room_data.get_room_key(position.room_name());
        if let Some(room_key) = room_key {
            cached_room_data[room_key].distance_map[position.xy()] = 0;
            frontier.push_back(State {
                g_score: 0,
                position,
                room_key,
            });
        }
    }

    while let Some(State {
        g_score,
        position,
        room_key,
    }) = frontier.pop_front()
    {
        if ops_remaining == 0 {
            return SearchResult::new(
                cached_room_data.into(),
                found_targets,
                max_ops - ops_remaining,
            );
        }
        ops_remaining -= 1;

        if g_score >= max_path_cost {
            continue;
        }

        for direction in preferred_directions(DirectionOrder::CardinalFirst) {
            let step_pos = match same_room_neighbor(position, *direction) {
                Some(pos) => pos,
                None => continue,
            };

            if !cached_room_data[room_key]
                .cost_matrix
                .as_ref()
                .map(|matrix| matrix.get(step_pos.xy()) < 255)
                .unwrap_or(false)
            {
                continue;
            }

            let neighbor = portal_index
                .exit(step_pos)
                .unwrap_or_else(|| corresponding_room_edge(step_pos));

            let neighbor_room_key = if neighbor.room_name() == position.room_name() {
                room_key
            } else {
                match cached_room_data.get_room_key(neighbor.room_name()) {
                    Some(key) => {
                        if cached_room_data[key].cost_matrix.is_none() {
                            continue;
                        }
                        key
                    }
                    None => continue,
                }
            };

            let next_cost = g_score.saturating_add(1);

            if cached_room_data[neighbor_room_key].distance_map[neighbor.xy()] <= next_cost {
                continue;
            }

            cached_room_data[neighbor_room_key].distance_map[neighbor.xy()] = next_cost;
            frontier.push_back(State {
                g_score: next_cost,
                position: neighbor,
                room_key: neighbor_room_key,
            });

            if let Some(ref mut all_of_destinations) = all_of_destinations {
                all_of_destinations.retain(|(target, range)| {
                    if target.room_name() == neighbor.room_name()
                        && target.get_range_to(neighbor) <= *range as u32
                    {
                        found_targets.push(neighbor);
                        false
                    } else {
                        true
                    }
                });
                if all_of_destinations.is_empty() {
                    return SearchResult::new(
                        cached_room_data.into(),
                        found_targets,
                        max_ops - ops_remaining,
                    );
                }
            }
            if let Some(ref any_of_destinations) = any_of_destinations {
                if any_of_destinations.iter().any(|(target, range)| {
                    target.room_name() == neighbor.room_name()
                        && target.get_range_to(neighbor) <= *range as u32
                }) {
                    found_targets.push(neighbor);
                    return SearchResult::new(
                        cached_room_data.into(),
                        found_targets,
                        max_ops - ops_remaining,
                    );
                }
            }
        }
    }

    SearchResult::new(
        cached_room_data.into(),
        found_targets,
        max_ops - ops_remaining,
    )
}

/// WASM wrapper for the BFS multiroom distance map function.
///
/// # Arguments
/// * `start_packed` - Array of packed position integers representing start positions
/// * `get_cost_matrix` - JavaScript function that returns cost matrices for rooms
/// * `max_ops` - Maximum number of tiles to explore
/// * `max_rooms` - Maximum number of rooms to explore
/// * `max_room_distance` - Maximum Manhattan distance in rooms to explore
/// * `max_path_cost` - Maximum distance in tiles to explore
/// * `any_of_destinations` - Array of packed positions to trigger early exit when any are reached
/// * `all_of_destinations` - Array of packed positions to trigger early exit when all are reached
///
/// # Returns
/// A `MultiroomDistanceMap` containing the distances from the start positions
#[wasm_bindgen]
pub fn js_bfs_multiroom_distance_map(
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
        max_ops,
        max_rooms,
        max_path_cost,
        any_of_destinations,
        all_of_destinations,
    )
}

#[wasm_bindgen]
pub fn js_bfs_portal_multiroom_distance_map(
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
        bfs_portal_multiroom_distance_map(
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
