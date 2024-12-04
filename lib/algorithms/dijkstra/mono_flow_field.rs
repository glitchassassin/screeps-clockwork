use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap, HashSet};

use screeps::{LocalCostMatrix, Position, RoomXY};
use wasm_bindgen::prelude::*;

use crate::cost_matrix::ClockworkCostMatrix;
use crate::datatypes::MonoFlowField;

#[derive(Copy, Clone, Eq, PartialEq)]
struct State {
    cost: usize,
    position: RoomXY,
}

impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        // Flip ordering for min-heap
        other.cost.cmp(&self.cost)
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// Creates a flow field for the given start positions, using Dijkstra's algorithm to
/// factor in terrain costs (0-255, where 255 is impassable).
///
/// This calculates a flow field for a single room (where the starting position(s) are
/// located).
pub fn dijkstra_mono_flow_field(
    start: Vec<RoomXY>,
    cost_matrix: &LocalCostMatrix,
) -> MonoFlowField {
    let mut frontier = BinaryHeap::new();
    let mut flow_field = MonoFlowField::new();
    let mut visited = HashSet::new();
    let mut costs = HashMap::new();

    // Initialize with start positions
    for position in start {
        frontier.push(State { cost: 0, position });
        flow_field.set(position, None);
        costs.insert(position, 0);
        visited.insert(position);
    }

    while let Some(State { cost, position }) = frontier.pop() {
        // Skip if we've found a better path
        if cost > *costs.get(&position).unwrap_or(&usize::MAX) {
            continue;
        }

        let position_is_edge = position.is_room_edge();
        for neighbor in position.neighbors() {
            if position_is_edge && neighbor.is_room_edge() {
                // Cannot move from one edge tile to another
                continue;
            }
            let terrain_cost = cost_matrix.get(neighbor);
            if terrain_cost >= 255 {
                continue;
            }

            let next_cost = cost + terrain_cost as usize;

            if !visited.contains(&neighbor)
                || next_cost < *costs.get(&neighbor).unwrap_or(&usize::MAX)
            {
                frontier.push(State {
                    cost: next_cost,
                    position: neighbor,
                });
                let direction = neighbor.get_direction_to(position).unwrap();
                flow_field.set(neighbor, Some(direction));
                costs.insert(neighbor, next_cost);
                visited.insert(neighbor);
            }
        }
    }

    flow_field
}

/// WASM wrapper for the Dijkstra mono flow field function.
#[wasm_bindgen]
pub fn js_dijkstra_mono_flow_field(
    start_packed: Vec<u32>,
    cost_matrix: &ClockworkCostMatrix,
) -> MonoFlowField {
    let start_room_xy = start_packed
        .iter()
        .map(|pos| RoomXY::from(Position::from_packed(*pos)))
        .collect();
    let local_cost_matrix = cost_matrix.get_internal();
    dijkstra_mono_flow_field(start_room_xy, &local_cost_matrix)
}
