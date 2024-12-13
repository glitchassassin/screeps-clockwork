use crate::algorithms::map::neighbors;
use crate::datatypes::Path;
use crate::DistanceMap;
use screeps::Position;
use screeps::RoomXY;
use std::collections::HashSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_str;

pub fn path_to_distance_map_origin(
    start: Position,
    distance_map: &DistanceMap,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;

    // Maximum iterations to prevent infinite loops (50x50 room size)
    const MAX_STEPS: usize = 2500;
    let mut steps = 0;

    while steps < MAX_STEPS {
        let current_distance = distance_map[RoomXY::from(current)];

        // If we've reached the origin
        if current_distance == 0 {
            return Ok(path);
        }

        // Find the neighbor with the lowest distance value
        let mut next_pos = None;
        let mut min_distance = usize::MAX;

        for neighbor in neighbors(current) {
            if neighbor.room_name() != current.room_name() {
                continue; // skip neighbors in different rooms
            }

            let neighbor_distance = distance_map[RoomXY::from(neighbor)];
            if neighbor_distance < min_distance {
                min_distance = neighbor_distance;
                next_pos = Some(neighbor);
            }
        }

        // If no valid next position is found, return an error
        if let Some(next) = next_pos {
            if visited.contains(&next) {
                return Err("Cycle detected in distance map");
            }

            current = next;
            path.add(current);
            visited.insert(current);
        } else {
            return Err("No valid path to origin found");
        }

        steps += 1;
    }

    Err("Path exceeded maximum length")
}

#[wasm_bindgen]
pub fn js_path_to_distance_map_origin(start: u32, distance_map: &DistanceMap) -> Path {
    match path_to_distance_map_origin(Position::from_packed(start), distance_map) {
        Ok(path) => path,
        Err(e) => {
            throw_str(&format!(
                "Error calculating path to distance map origin: {}",
                e
            ));
        }
    }
}
