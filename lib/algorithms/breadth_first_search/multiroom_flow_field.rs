use crate::cost_matrix::ClockworkCostMatrix;
use crate::datatypes::MultiroomFlowField;
use crate::utils::set_panic_hook;
use screeps::{Position, RoomName};
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

use super::multiroom_distance_map::bfs_multiroom_distance_map;

/// Creates a flow field for the given start positions, using a breadth-first search.
/// This does not factor in terrain costs (treating anything less than 255 in the cost
/// matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
pub fn bfs_multiroom_flow_field(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<Position>>,
    all_of_destinations: Option<Vec<Position>>,
) -> MultiroomFlowField {
    set_panic_hook();
    let mut flow_field = MultiroomFlowField::new();
    let distance_map = bfs_multiroom_distance_map(
        start,
        get_cost_matrix,
        max_tiles,
        max_rooms,
        max_room_distance,
        max_tile_distance,
        any_of_destinations,
        all_of_destinations,
    );

    for room in distance_map.rooms() {
        let room_map = distance_map.get_room_map(room).unwrap();
        for (position, &value) in room_map.enumerate() {
            if value == usize::MAX {
                continue; // unreachable
            }
            let min_distance = position
                .neighbors()
                .iter()
                .map(|neighbor| room_map[*neighbor])
                .min();
            if let Some(min_distance) = min_distance {
                if min_distance < value {
                    let directions = position
                        .neighbors()
                        .iter()
                        .filter(|neighbor| room_map[**neighbor] == min_distance)
                        .map(|neighbor| position.get_direction_to(*neighbor).unwrap())
                        .collect();
                    flow_field
                        .set_directions(Position::new(position.x, position.y, room), directions);
                }
            }
        }
    }

    flow_field
}

/// WASM wrapper for the BFS multiroom flow field function.
#[wasm_bindgen]
pub fn js_bfs_multiroom_flow_field(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<u32>>,
    all_of_destinations: Option<Vec<u32>>,
) -> MultiroomFlowField {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();
    bfs_multiroom_flow_field(
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
