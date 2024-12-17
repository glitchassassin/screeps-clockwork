use crate::algorithms::map::manhattan_distance;
use crate::algorithms::map::neighbors;
use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::MultiroomDistanceMap;
use crate::utils::set_panic_hook;
use screeps::Position;
use screeps::RoomName;
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap, HashSet};
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

#[derive(Copy, Clone, Eq, PartialEq)]
struct State {
    cost: usize,
    position: Position,
}

impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other.cost.cmp(&self.cost)
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

pub fn dijkstra_multiroom_distance_map(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<Position>>,
    all_of_destinations: Option<Vec<Position>>,
) -> MultiroomDistanceMap {
    set_panic_hook();
    let origin_rooms = start.iter().map(|p| p.room_name()).collect::<HashSet<_>>();
    let mut frontier = BinaryHeap::new();
    let mut visited = HashSet::new();
    let any_of_destinations =
        any_of_destinations.and_then(|d| Some(d.iter().cloned().collect::<HashSet<_>>()));
    let mut all_of_destinations =
        all_of_destinations.and_then(|d| Some(d.iter().cloned().collect::<HashSet<_>>()));
    let mut multiroom_distance_map = MultiroomDistanceMap::new();
    let mut cost_matrices = HashMap::new();

    // Initialize with start positions
    for position in start {
        frontier.push(State { cost: 0, position });
        multiroom_distance_map.get_or_create_room_map(position.room_name())[position.xy()] = 0;
        visited.insert(position);
    }

    while let Some(State { cost, position }) = frontier.pop() {
        if cost >= max_tile_distance {
            continue;
        }

        for neighbor in neighbors(position).into_iter() {
            let room_name = neighbor.room_name();
            let cost_matrix = if let Some(matrix) = cost_matrices.get(&room_name) {
                matrix
            } else if cost_matrices.len() >= max_rooms
                || origin_rooms
                    .iter()
                    .all(|room| manhattan_distance(room, &room_name) > max_room_distance)
            {
                continue;
            } else if let Some(matrix) = get_cost_matrix(neighbor.room_name()) {
                cost_matrices.insert(neighbor.room_name(), matrix);
                cost_matrices.get(&neighbor.room_name()).unwrap()
            } else {
                continue;
            };

            let terrain_cost = cost_matrix.get_internal().get(neighbor.xy());
            if terrain_cost >= 255 {
                continue;
            }

            let next_cost = cost + terrain_cost as usize;
            let current_cost = multiroom_distance_map
                .get_room_map(neighbor.room_name())
                .map_or(usize::MAX, |map| map[neighbor.xy()]);

            if !visited.contains(&neighbor) || next_cost < current_cost {
                frontier.push(State {
                    cost: next_cost,
                    position: neighbor,
                });
                multiroom_distance_map.get_or_create_room_map(neighbor.room_name())
                    [neighbor.xy()] = next_cost;
                visited.insert(neighbor);
                if let Some(ref mut all_of) = all_of_destinations {
                    all_of.remove(&neighbor);
                    if all_of.is_empty() {
                        return multiroom_distance_map;
                    }
                }
                if let Some(ref destinations) = any_of_destinations {
                    if destinations.contains(&neighbor) {
                        return multiroom_distance_map;
                    }
                }
            }

            if visited.len() >= max_tiles {
                return multiroom_distance_map;
            }
        }
    }

    multiroom_distance_map
}

#[wasm_bindgen]
pub fn js_dijkstra_multiroom_distance_map(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<u32>>,
    all_of_destinations: Option<Vec<u32>>,
) -> MultiroomDistanceMap {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();
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
        max_tiles,
        max_rooms,
        max_room_distance,
        max_tile_distance,
        any_of_destinations
            .and_then(|d| Some(d.iter().map(|pos| Position::from_packed(*pos)).collect())),
        all_of_destinations
            .and_then(|d| Some(d.iter().map(|pos| Position::from_packed(*pos)).collect())),
    )
}
