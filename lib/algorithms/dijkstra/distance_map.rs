use crate::cost_matrix::ClockworkCostMatrix;
use crate::DistanceMap;
use screeps::LocalCostMatrix;
use screeps::Position;
use screeps::RoomXY;
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashSet};
use wasm_bindgen::prelude::*;

// Add this structure to handle the priority queue elements
#[derive(Copy, Clone, Eq, PartialEq)]
struct State {
    cost: usize,
    position: RoomXY,
}

// Implement Ord for State to make it work with BinaryHeap
impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        // Notice we flip the ordering here to make BinaryHeap a min-heap
        other.cost.cmp(&self.cost)
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Creates a distance map for the given start positions, using Dijkstra's algorithm to
/// factor in terrain costs (0-255, where 255 is impassable).
///
/// This calculates a distance map for a single room (where the starting position(s) are
/// located).
pub fn dijkstra_distance_map(start: Vec<RoomXY>, cost_matrix: &LocalCostMatrix) -> DistanceMap {
    let mut frontier = BinaryHeap::new();
    let mut visited = HashSet::new();
    let mut distance_map = DistanceMap::new();

    // Initialize with start positions
    for position in start {
        frontier.push(State { cost: 0, position });
        distance_map[position] = 0;
        visited.insert(position);
    }

    while let Some(State { cost, position }) = frontier.pop() {
        // If we've found a longer path, skip
        if cost > distance_map[position] {
            continue;
        }

        for neighbor in position.neighbors() {
            let terrain_cost = cost_matrix.get(neighbor);
            if terrain_cost >= 255 {
                continue;
            }

            let next_cost = cost + terrain_cost as usize;

            if !visited.contains(&neighbor) || next_cost < distance_map[neighbor] {
                frontier.push(State {
                    cost: next_cost,
                    position: neighbor,
                });
                distance_map[neighbor] = next_cost;
                visited.insert(neighbor);
            }
        }
    }

    distance_map
}

/// WASM wrapper for the Dijkstra distance map function.
#[wasm_bindgen]
pub fn js_dijkstra_distance_map(
    start_packed: Vec<u32>,
    cost_matrix: &ClockworkCostMatrix,
) -> DistanceMap {
    let start_room_xy = start_packed
        .iter()
        .map(|pos| RoomXY::from(Position::from_packed(*pos)))
        .collect();
    let local_cost_matrix = cost_matrix.get_internal();
    dijkstra_distance_map(start_room_xy, &local_cost_matrix)
}
