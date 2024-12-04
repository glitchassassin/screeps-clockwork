use std::collections::{HashSet, VecDeque};

use screeps::{LocalCostMatrix, Position, RoomXY};
use wasm_bindgen::prelude::*;

use crate::cost_matrix::ClockworkCostMatrix;
use crate::datatypes::MonoFlowField;

/// Creates a flow field for the given start positions, using a breadth-first search.
/// This does not factor in terrain costs (treating anything less than 255 in the cost
/// matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
///
/// This calculates a flow field for a single room (where the starting position(s) are
/// located).
pub fn bfs_mono_flow_field(start: Vec<RoomXY>, cost_matrix: &LocalCostMatrix) -> MonoFlowField {
    // Initialize the frontier with the passable positions surrounding the start positions
    let mut frontier = VecDeque::from(start.clone());
    let mut flow_field = MonoFlowField::new();
    let targets = start.iter().cloned().collect::<HashSet<_>>();
    let mut visited = start.iter().cloned().collect::<HashSet<_>>();

    // initialize the distance map with the start positions
    for position in start {
        flow_field.set(position, None);
    }

    while let Some(position) = frontier.pop_front() {
        for neighbor in position
            .neighbors()
            .into_iter()
            .filter(|n| !(n.is_room_edge() && position.is_room_edge()))
        {
            if cost_matrix.get(neighbor) < 255 && !visited.contains(&neighbor) {
                let direction = neighbor.get_direction_to(position).unwrap();
                flow_field.set(neighbor, Some(direction));
                if !neighbor.is_room_edge() || targets.contains(&neighbor) {
                    frontier.push_back(neighbor);
                }
                visited.insert(neighbor);
            } else {
                visited.insert(neighbor);
            }
        }
    }

    flow_field
}

/// WASM wrapper for the BFS mono flow field function.
#[wasm_bindgen]
pub fn js_bfs_mono_flow_field(
    start_packed: Vec<u32>,
    cost_matrix: &ClockworkCostMatrix,
) -> MonoFlowField {
    let start_room_xy = start_packed
        .iter()
        .map(|pos| RoomXY::from(Position::from_packed(*pos)))
        .collect();
    let local_cost_matrix = cost_matrix.get_internal();
    bfs_mono_flow_field(start_room_xy, &local_cost_matrix)
}
