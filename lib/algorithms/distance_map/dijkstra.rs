use crate::algorithms::distance_map::astar::astar_multiroom_distance_map;
use crate::datatypes::ClockworkCostMatrix;
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
