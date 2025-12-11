use crate::algorithms::map::corresponding_room_edge;
use crate::algorithms::map::neighbors_directions_without_edges;
use crate::algorithms::map::neighbors_without_edges;
use crate::algorithms::path::preference::PathPreferenceGonality;
use crate::algorithms::path::preference::PathPreferenceTurns;
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::Path;
use crate::log;
use screeps::Position;
use std::collections::HashSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_str;

// Maximum iterations to prevent infinite loops (50x50 room size)
const MAX_STEPS: usize = 2500;

pub fn path_to_multiroom_distance_map_origin(
    start: Position,
    distance_map: &MultiroomDistanceMap,
    prefer_diagonal: PathPreferenceGonality,
    prefer_turns: PathPreferenceTurns
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;
    let mut steps = 0;

    while steps < MAX_STEPS {
        path.add(current);

        let current_distance = distance_map.get(current);
        if current_distance == 0 {
            // We've reached the origin
            return Ok(path);
        }

        // Find the neighbor with the lowest distance value
        let mut next_pos = None;
        let mut min_distance = usize::MAX;

        if prefer_diagonal != PathPreferenceGonality::None || prefer_turns != PathPreferenceTurns::None {
            let mut prev_direction = None;
            for (neighbor, direction) in neighbors_directions_without_edges(current) {
                let neighbor_distance = distance_map.get(neighbor);

                let mut better = false;
                if neighbor_distance < min_distance {
                    better = true;
                } else if neighbor_distance == min_distance {
                    if prefer_turns != PathPreferenceTurns::None {
                        if (prefer_turns == PathPreferenceTurns::Straight) == (match prev_direction {None=>false,Some(prev_direction)=>direction == prev_direction}) {
                            better = true;
                        }
                        if !better && prefer_diagonal != PathPreferenceGonality::None {
                            if (prefer_diagonal == PathPreferenceGonality::Diagonal) == direction.is_diagonal() {
                                better = true;
                            }
                        }
                    }
                }
                if better {
                    min_distance = neighbor_distance;
                    next_pos = Some(neighbor);
                }
                prev_direction = Some(direction);
            }
        } else {
            for neighbor in neighbors_without_edges(current) {
                let neighbor_distance = distance_map.get(neighbor);

                if neighbor_distance < min_distance {
                    min_distance = neighbor_distance;
                    next_pos = Some(neighbor);
                }
            }
        }

        // If no valid next position is found, return an error
        if let Some(next) = next_pos {
            if visited.contains(&next) {
                log(&format!("Cycle detected in distance map at {:?}", next));
                log(&format!("Visited: {:?}", visited));
                return Err("Cycle detected in distance map");
            }

            // if next is a room edge, jump to the corresponding room edge
            if next.is_room_edge() {
                path.add(next);
            }
            current = corresponding_room_edge(next);
            visited.insert(current);
        } else {
            return Err("No valid path to origin found");
        }

        steps += 1;
    }

    Err("Path exceeded maximum length")
}

#[wasm_bindgen]
pub fn js_path_to_multiroom_distance_map_origin(
    start: u32,
    distance_map: &MultiroomDistanceMap,
    prefer_diagonal: PathPreferenceGonality,
    prefer_turns: PathPreferenceTurns
) -> Path {
    match path_to_multiroom_distance_map_origin(Position::from_packed(start), distance_map, prefer_diagonal, prefer_turns) {
        Ok(path) => path,
        Err(e) => throw_str(&format!(
            "Error calculating path to multiroom distance map origin: {}",
            e
        )),
    }
}
