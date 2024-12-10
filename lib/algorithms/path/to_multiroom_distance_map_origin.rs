use crate::algorithms::map::corresponding_room_edge;
use crate::algorithms::map::neighbors;
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::Path;
use crate::log;
use screeps::Position;
use std::collections::HashSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen::throw_str;

pub fn path_to_multiroom_distance_map_origin(
    start: Position,
    distance_map: &MultiroomDistanceMap,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;
    path.add(current);

    // Maximum iterations to prevent infinite loops (50x50 room size)
    const MAX_STEPS: usize = 2500;
    let mut steps = 0;

    while steps < MAX_STEPS {
        let current_distance = distance_map.get(current);

        // If we've reached the origin
        if current_distance == 0 {
            return Ok(path);
        }

        // Find the neighbor with the lowest distance value
        let mut next_pos = None;
        let mut min_distance = usize::MAX;

        for neighbor in current
            .xy()
            .neighbors()
            .into_iter()
            .map(|xy| Position::new(xy.x, xy.y, current.room_name()))
        {
            let neighbor_distance = distance_map.get(neighbor);
            if neighbor_distance < min_distance {
                min_distance = neighbor_distance;
                next_pos = Some(neighbor);
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
            current = corresponding_room_edge(next);
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
pub fn js_path_to_multiroom_distance_map_origin(
    start: u32,
    distance_map: &MultiroomDistanceMap,
) -> Path {
    match path_to_multiroom_distance_map_origin(Position::from_packed(start), distance_map) {
        Ok(path) => path,
        Err(e) => throw_str(&format!(
            "Error calculating path to multiroom distance map origin: {}",
            e
        )),
    }
}
