use std::collections::HashSet;

use super::distance_map::bfs_distance_map;
use crate::cost_matrix::ClockworkCostMatrix;
use crate::FlowField;
use screeps::RoomXY;
use screeps::{LocalCostMatrix, Position};
use wasm_bindgen::prelude::*;

/// Creates a flow field for the given start positions, using a breadth-first search.
/// This does not factor in terrain costs (treating anything less than 255 in the cost
/// matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
///
/// This calculates a flow field for a single room (where the starting position(s) are
/// located).
pub fn bfs_flow_field(start: Vec<RoomXY>, cost_matrix: &LocalCostMatrix) -> FlowField {
    // Initialize the frontier with the passable positions surrounding the start positions
    let targets = start.iter().cloned().collect::<HashSet<_>>();
    let distance_map = bfs_distance_map(start, cost_matrix);
    let mut flow_field = FlowField::new();

    for (position, &value) in distance_map.enumerate() {
        if value == usize::MAX {
            continue; // unreachable
        }
        let neighbors: Vec<RoomXY> = position
            .neighbors()
            .into_iter()
            .filter(|neighbor| cost_matrix.get(*neighbor) < 255)
            // Cannot move to an edge tile unless it's a target AND the source is not also an edge tile
            .filter(|neighbor| {
                !neighbor.is_room_edge() || (!position.is_room_edge() && targets.contains(neighbor))
            })
            .collect();
        let min_distance = neighbors
            .iter()
            .map(|neighbor| distance_map[neighbor])
            .min();
        if let Some(min_distance) = min_distance {
            if min_distance < value {
                let directions = neighbors
                    .iter()
                    .filter(|neighbor| distance_map[**neighbor] == min_distance)
                    .map(|neighbor| position.get_direction_to(*neighbor).unwrap())
                    .collect();
                flow_field.set_directions(position.x, position.y, directions);
            }
        }
    }

    flow_field
}

/// WASM wrapper for the BFS flow field function.
#[wasm_bindgen]
pub fn js_bfs_flow_field(start_packed: Vec<u32>, cost_matrix: &ClockworkCostMatrix) -> FlowField {
    let start_room_xy = start_packed
        .iter()
        .map(|pos| RoomXY::from(Position::from_packed(*pos)))
        .collect();
    let local_cost_matrix = cost_matrix.get_internal();
    bfs_flow_field(start_room_xy, &local_cost_matrix)
}
