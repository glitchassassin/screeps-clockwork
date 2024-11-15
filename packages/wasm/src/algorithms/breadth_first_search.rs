use std::collections::{HashSet, VecDeque};

use screeps::{LocalCostMatrix, Position, RoomCoordinate, RoomPosition, RoomXY};
use wasm_bindgen::prelude::*;

use crate::cost_matrix::ClockworkCostMatrix;
use crate::{DistanceMap, FlowField};

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
#[wasm_bindgen]
pub fn js_bfs_distance_map(
    start_packed: Vec<RoomPosition>,
    cost_matrix: &ClockworkCostMatrix,
) -> DistanceMap {
    let start_room_xy = start_packed
        .iter()
        .map(|pos| RoomXY::from(Position::from(pos)))
        .collect();
    let local_cost_matrix = cost_matrix.get_internal();
    bfs_distance_map(start_room_xy, &local_cost_matrix)
}

/**
 * Creates a flow field for the given start positions, using a breadth-first search.
 * This does not factor in terrain costs (treating anything less than 255 in the cost
 * matrix as passable), so it's faster but less useful than Dijkstra's algorithm.
 *
 * This calculates a flow field for a single room (where the starting position(s) are
 * located).
 */
pub fn bfs_flow_field(start: Vec<RoomXY>, cost_matrix: &LocalCostMatrix) -> FlowField {
    // Initialize the frontier with the passable positions surrounding the start positions
    let distance_map = bfs_distance_map(start, cost_matrix);
    let mut flow_field = FlowField::new();

    for (index, distance) in distance_map.into_iter().enumerate() {
        let x = RoomCoordinate::new((index % 50) as u8).unwrap_or_else(|_| {
            wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", index % 50))
        });
        let y = RoomCoordinate::new((index / 50) as u8).unwrap_or_else(|_| {
            wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", index / 50))
        });
        let position = RoomXY::new(x, y);
        if cost_matrix.get(position) >= 255 {
            continue;
        }
        let neighbors: Vec<RoomXY> = position
            .neighbors()
            .into_iter()
            .filter(|neighbor| cost_matrix.get(*neighbor) < 255)
            .collect();
        let min_distance = neighbors
            .iter()
            .map(|neighbor| distance_map.get(neighbor.x, neighbor.y))
            .min();
        if let Some(min_distance) = min_distance {
            let directions = neighbors
                .iter()
                .filter(|neighbor| distance_map.get(neighbor.x, neighbor.y) == min_distance)
                .map(|neighbor| neighbor.get_direction_to(position).unwrap())
                .collect();
            flow_field.set_directions(position.x, position.y, directions);
        }
    }

    flow_field
}

/**
 * WASM wrapper for the BFS flow field function.
 */
#[wasm_bindgen]
pub fn js_bfs_flow_field(start_packed: Vec<u32>, cost_matrix: &ClockworkCostMatrix) -> FlowField {
    let start_room_xy = start_packed
        .iter()
        .map(|pos| RoomXY::from(Position::from_packed(*pos)))
        .collect();
    let local_cost_matrix = cost_matrix.get_internal();
    bfs_flow_field(start_room_xy, &local_cost_matrix)
}
