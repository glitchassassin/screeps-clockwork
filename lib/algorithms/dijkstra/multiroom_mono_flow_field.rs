use crate::cost_matrix::ClockworkCostMatrix;
use crate::datatypes::MultiroomMonoFlowField;
use crate::utils::set_panic_hook;
use screeps::{Position, RoomName};
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_val;

use super::multiroom_distance_map::dijkstra_multiroom_distance_map;

pub fn dijkstra_multiroom_mono_flow_field(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<Position>>,
    all_of_destinations: Option<Vec<Position>>,
) -> MultiroomMonoFlowField {
    set_panic_hook();
    let mut flow_field = MultiroomMonoFlowField::new();
    let distance_map = dijkstra_multiroom_distance_map(
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
                    let direction = position
                        .neighbors()
                        .iter()
                        .filter(|neighbor| room_map[**neighbor] == min_distance)
                        .map(|neighbor| position.get_direction_to(*neighbor).unwrap())
                        .next();
                    flow_field.set(Position::new(position.x, position.y, room), direction);
                }
            }
        }
    }

    flow_field
}

#[wasm_bindgen]
pub fn js_dijkstra_multiroom_mono_flow_field(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_tiles: usize,
    max_rooms: usize,
    max_room_distance: usize,
    max_tile_distance: usize,
    any_of_destinations: Option<Vec<u32>>,
    all_of_destinations: Option<Vec<u32>>,
) -> MultiroomMonoFlowField {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();

    dijkstra_multiroom_mono_flow_field(
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
