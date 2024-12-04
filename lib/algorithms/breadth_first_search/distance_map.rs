use crate::cost_matrix::ClockworkCostMatrix;
use crate::DistanceMap;
use screeps::LocalCostMatrix;
use screeps::Position;
use screeps::RoomXY;
use std::collections::HashSet;
use std::collections::VecDeque;
use wasm_bindgen::prelude::*;

/// Creates a distance map for the given start positions, using a breadth-first search.
/// This does not factor in terrain costs (treating anything less than 255 in the cost
/// matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
///
/// This calculates a distance map for a single room (where the starting position(s) are
/// located).
pub fn bfs_distance_map(start: Vec<RoomXY>, cost_matrix: &LocalCostMatrix) -> DistanceMap {
    // Initialize the frontier with the passable positions surrounding the start positions
    let mut frontier = VecDeque::from(start.clone());
    let mut visited = start.iter().cloned().collect::<HashSet<_>>();
    let mut distance_map = DistanceMap::new();

    // initialize the distance map with the start positions
    for position in start {
        distance_map[position] = 0;
    }

    while let Some(position) = frontier.pop_front() {
        let current_distance = distance_map[position];
        for neighbor in position.neighbors() {
            if position.is_room_edge() && neighbor.is_room_edge() {
                // Cannot move from one edge tile to another
                continue;
            }
            if cost_matrix.get(neighbor) < 255 && !visited.contains(&neighbor) {
                distance_map[neighbor] = current_distance + 1;
                frontier.push_back(neighbor);
                visited.insert(neighbor);
            } else {
                visited.insert(neighbor);
            }
        }
    }

    distance_map
}

/// WASM wrapper for the BFS distance map function.
#[wasm_bindgen]
pub fn js_bfs_distance_map(
    start_packed: Vec<u32>,
    cost_matrix: &ClockworkCostMatrix,
) -> DistanceMap {
    let start_room_xy = start_packed
        .iter()
        .map(|pos| RoomXY::from(Position::from_packed(*pos)))
        .collect();
    let local_cost_matrix = cost_matrix.get_internal();
    bfs_distance_map(start_room_xy, &local_cost_matrix)
}
