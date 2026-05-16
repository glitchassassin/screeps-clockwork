use crate::algorithms::map::corresponding_room_edge;
use crate::algorithms::map::neighbors_without_edges;
use crate::algorithms::map::DirectionOrder;
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::Path;
use crate::log;
use screeps::Position;
use std::collections::HashSet;
use wasm_bindgen::prelude::*;

// Maximum iterations to prevent infinite loops (50x50 room size)
const MAX_STEPS: usize = 2500;

pub fn path_to_multiroom_distance_map_origin(
    start: Position,
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
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
        let mut min_distance = current_distance;

        for neighbor in neighbors_without_edges(current, direction_order) {
            let neighbor_distance = distance_map.get(neighbor);

            if neighbor_distance < min_distance {
                min_distance = neighbor_distance;
                next_pos = Some(neighbor);
            }
        }

        // If no valid next position is found, return an error
        if let Some(next) = next_pos {
            if min_distance == 0 {
                path.add(next);
                return Ok(path);
            }

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
    direction_order: DirectionOrder,
) -> Result<Path, JsValue> {
    match path_to_multiroom_distance_map_origin(
        Position::from_packed(start),
        distance_map,
        direction_order,
    ) {
        Ok(path) => Ok(path),
        Err(e) => Err(js_sys::Error::new(&format!(
            "Error calculating path to multiroom distance map origin: {}",
            e
        ))
        .into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use screeps::{RoomCoordinate, RoomName};

    fn room(name: &str) -> RoomName {
        name.parse().unwrap()
    }

    fn pos(x: u8, y: u8, room_name: &str) -> Position {
        Position::new(
            RoomCoordinate::new(x).unwrap(),
            RoomCoordinate::new(y).unwrap(),
            room(room_name),
        )
    }

    #[test]
    fn path_stops_when_selected_edge_neighbor_is_origin() {
        let origin = pos(25, 49, "W1N1");
        let midpoint = pos(25, 48, "W1N1");
        let start = pos(25, 47, "W1N1");
        let mut distance_map = MultiroomDistanceMap::new();
        distance_map.set(origin, 0);
        distance_map.set(midpoint, 1);
        distance_map.set(start, 2);

        let path = path_to_multiroom_distance_map_origin(
            start,
            &distance_map,
            DirectionOrder::CardinalFirst,
        )
        .unwrap();

        assert_eq!(path.len(), 3);
        assert_eq!(path.get(0), Some(&start));
        assert_eq!(path.get(1), Some(&midpoint));
        assert_eq!(path.get(2), Some(&origin));
    }

    #[test]
    fn path_rejects_neighbors_that_are_not_strictly_closer_to_origin() {
        let start = pos(25, 25, "W1N1");
        let equal_distance_neighbor = pos(26, 25, "W1N1");
        let mut distance_map = MultiroomDistanceMap::new();
        distance_map.set(start, 5);
        distance_map.set(equal_distance_neighbor, 5);

        let result = path_to_multiroom_distance_map_origin(
            start,
            &distance_map,
            DirectionOrder::CardinalFirst,
        );

        assert_eq!(result.err(), Some("No valid path to origin found"));
    }
}
