use crate::algorithms::astar::metrics::PathfindingMetrics;
use crate::algorithms::jps::jump;
use crate::algorithms::map::corresponding_room_edge;
use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::OptionalCache;
use crate::utils::set_panic_hook;
use crate::Path;
use lazy_static::lazy_static;
use rustc_hash::FxHashMap;
use screeps::Direction;
use screeps::Position;
use screeps::RoomName;
use std::cmp::Ordering;
use std::collections::BinaryHeap;
use std::collections::HashMap;
use std::convert::TryFrom;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_str;
use wasm_bindgen::throw_val;

#[derive(Copy, Clone, Eq, PartialEq)]
struct State {
    f_score: usize,
    g_score: usize,
    position: Position,
    open_direction: Option<Direction>,
}

impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other.f_score.cmp(&self.f_score)
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn heuristic(position: Position, goal: &[Position]) -> usize {
    goal.iter()
        .map(|g| position.get_range_to(*g))
        .min()
        .unwrap_or(0) as usize
}

lazy_static! {
    static ref DIRECTION_LOOKUP: [Vec<Direction>; 9] = [
        // Any direction
        vec![
            Direction::Top,
            Direction::TopRight,
            Direction::Right,
            Direction::BottomRight,
            Direction::Bottom,
            Direction::BottomLeft,
            Direction::Left,
            Direction::TopLeft,
        ],
        // Direction::Top
        vec![Direction::Top, Direction::TopRight, Direction::TopLeft],
        // Direction::TopRight
        vec![
            Direction::TopRight,
            Direction::Top,
            Direction::Right,
            Direction::BottomRight,
            Direction::TopLeft,
        ],
        // Direction::Right
        vec![
            Direction::Right,
            Direction::BottomRight,
            Direction::TopRight,
        ],
        // Direction::BottomRight
        vec![
            Direction::BottomRight,
            Direction::Right,
            Direction::Bottom,
            Direction::TopRight,
            Direction::BottomLeft,
        ],
        // Direction::Bottom
        vec![
            Direction::Bottom,
            Direction::BottomRight,
            Direction::BottomLeft,
        ],
        // Direction::BottomLeft
        vec![
            Direction::BottomLeft,
            Direction::Left,
            Direction::Bottom,
            Direction::TopLeft,
            Direction::BottomRight,
        ],
        // Direction::Left
        vec![Direction::Left, Direction::BottomLeft, Direction::TopLeft],
        // Direction::TopLeft
        vec![
            Direction::TopLeft,
            Direction::Top,
            Direction::Left,
            Direction::BottomLeft,
            Direction::TopRight,
        ],
    ];
}

/// Returns the next directions to consider, based on the direction from which the tile
/// was entered. Lateral directions can be ruled out as an optimization.
fn next_directions(open_direction: Option<Direction>) -> &'static [Direction] {
    &DIRECTION_LOOKUP[open_direction.map(|d| d as usize).unwrap_or(0)]
}

/// Creates a distance map for the given start positions, using A* with jump-point search
/// to optimize the search and find the shortest path to the given destinations.
pub fn jps_path(
    start: Vec<Position>,
    get_cost_matrix: impl Fn(RoomName) -> Option<ClockworkCostMatrix>,
    max_ops: usize,
    goals: Vec<Position>,
) -> Result<Path, String> {
    set_panic_hook();
    let mut frontier = BinaryHeap::new();
    let mut came_from: FxHashMap<Position, (Position, usize)> = FxHashMap::default();
    let cost_matrices = OptionalCache::new(|room: RoomName| get_cost_matrix(room));
    let mut metrics = PathfindingMetrics::new();

    let start_room = start[0].room_name();

    // Initialize with start positions
    for position in start {
        frontier.push(State {
            f_score: 0,
            g_score: 0,
            position,
            open_direction: None,
        });
    }

    let mut current_room = start_room;
    let mut current_room_cost_matrix =
        if let Some(cost_matrix) = cost_matrices.get_or_create(current_room) {
            cost_matrix
        } else {
            return Err("Cannot plan path with no cost matrix".to_string());
        };

    while let Some(State {
        f_score: _,
        g_score,
        position,
        open_direction,
    }) = frontier.pop()
    {
        metrics.nodes_visited += 1;

        if metrics.nodes_visited >= max_ops {
            return Err("Max operations reached".to_string());
        }

        if goals.contains(&position) {
            let mut path = Path::new();
            let mut current = position;
            while let Some((previous, _)) = came_from.get(&current) {
                while current != *previous {
                    path.add(current);
                    let dir = current.get_direction_to(*previous).unwrap();
                    current = current.checked_add_direction(dir).unwrap_or_else(|_| {
                        throw_str("Failed to reconstruct path");
                    });
                }
            }
            return Ok(path);
        }

        let position_cost_matrix = cost_matrices.get_or_create(position.room_name()).unwrap();

        for direction in next_directions(open_direction) {
            metrics.neighbor_checks += 1;
            if let Some(neighbor) = jump(position, *direction, &goals, &position_cost_matrix) {
                metrics.jump_attempts += 1;
                // Interpolate between position and neighbor to fill in the distance map
                let mut step = position;
                let mut step_cost = g_score;
                while let Ok(next_step) = step
                    .checked_add_direction(*direction)
                    .map(corresponding_room_edge)
                {
                    if next_step.room_name() != current_room {
                        let next_matrix = cost_matrices.get_or_create(next_step.room_name());

                        if let Some(cost_matrix) = next_matrix {
                            current_room_cost_matrix = cost_matrix;
                            current_room = neighbor.room_name();
                        } else {
                            continue;
                        }
                    }
                    if next_step == neighbor {
                        break;
                    }
                    step_cost = step_cost
                        .saturating_add(current_room_cost_matrix.get(next_step.xy()) as usize);
                    match came_from.get(&next_step) {
                        Some((_, cost)) => {
                            if step_cost < *cost {
                                // better path found
                                came_from.insert(
                                    corresponding_room_edge(next_step),
                                    (corresponding_room_edge(step), step_cost),
                                );
                            }
                        }
                        None => {
                            came_from.insert(
                                corresponding_room_edge(next_step),
                                (corresponding_room_edge(step), step_cost),
                            );
                        }
                    }
                    step = next_step;
                }

                let jump_range = position.get_range_to(neighbor);
                metrics.max_jump_distance = metrics.max_jump_distance.max(jump_range as usize);
                let terrain_cost = current_room_cost_matrix.get(neighbor.xy());
                if terrain_cost >= 255 {
                    // impassable terrain
                    continue;
                }

                let next_cost = step_cost.saturating_add(terrain_cost as usize);

                if let Some((_, cost)) = came_from.get(&neighbor) {
                    if *cost <= next_cost {
                        // already visited and better path found
                        continue;
                    }
                }

                let h_score = heuristic(neighbor, &goals);
                let f_score = next_cost.saturating_add(h_score);
                frontier.push(State {
                    f_score,
                    g_score: next_cost,
                    position: neighbor,
                    open_direction: position.get_direction_to(neighbor),
                });
                came_from.insert(
                    corresponding_room_edge(neighbor),
                    (corresponding_room_edge(position), next_cost),
                );
            }
        }
    }

    Err("No path found".to_string())
}

#[wasm_bindgen]
pub fn js_jps_path(
    start_packed: Vec<u32>,
    get_cost_matrix: &js_sys::Function,
    max_ops: usize,
    destinations: Vec<u32>,
) -> Path {
    let start_positions = start_packed
        .iter()
        .map(|pos| Position::from_packed(*pos))
        .collect();
    let path = jps_path(
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

            let cost_matrix = if value.is_undefined() {
                None
            } else {
                Some(
                    ClockworkCostMatrix::try_from(value)
                        .ok()
                        .expect_throw("Invalid ClockworkCostMatrix"),
                )
            };

            cost_matrix
        },
        max_ops,
        destinations
            .iter()
            .map(|pos| Position::from_packed(*pos))
            .collect(),
    );

    match path {
        Ok(path) => path,
        Err(e) => throw_str(&e),
    }
}
