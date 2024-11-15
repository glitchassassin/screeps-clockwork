use std::collections::{HashSet, VecDeque};

use screeps::objects::CostMatrix;
use screeps::{LocalCostMatrix, Position, RoomXY};
use wasm_bindgen::prelude::*;

use crate::DistanceMap;

/**
 * Creates a distance map for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs (treating anything less than 255 in the cost
 * matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
 *
 * This calculates a distance map for a single room (where the starting position(s) are
 * located).
 */
pub fn bfs_distance_map(start: Vec<RoomXY>, cost_matrix: &LocalCostMatrix) -> DistanceMap {
    // Initialize the frontier with the passable positions surrounding the start positions
    let mut frontier = VecDeque::from(start.clone());
    let mut visited = start.iter().cloned().collect::<HashSet<_>>();
    let mut distance_map = DistanceMap::new();

    while let Some(position) = frontier.pop_front() {
        let current_distance = distance_map.get(position.x, position.y);
        for neighbor in position.neighbors() {
            if cost_matrix.get(neighbor) < 255 && !visited.contains(&neighbor) {
                distance_map.set(neighbor.x, neighbor.y, current_distance + 1);
                frontier.push_back(neighbor);
                visited.insert(neighbor);
            } else {
                visited.insert(neighbor);
            }
        }
    }

    distance_map
}

/**
 * WASM wrapper for the BFS distance map function.
 */
#[wasm_bindgen(js_name = bfs_distance_map)]
pub fn js_bfs_distance_map(start_packed: Vec<u32>, cost_matrix: CostMatrix) -> DistanceMap {
    let start_room_xy = start_packed
        .iter()
        .map(|packed| RoomXY::from(Position::from_packed(*packed)))
        .collect();
    let local_cost_matrix = LocalCostMatrix::from(&cost_matrix);
    bfs_distance_map(start_room_xy, &local_cost_matrix)
}
