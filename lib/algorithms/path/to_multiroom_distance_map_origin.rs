use crate::algorithms::map::corresponding_room_edge;
use crate::algorithms::map::neighbors_without_edges;
use crate::algorithms::map::DirectionOrder;
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::Path;
use screeps::Position;
use wasm_bindgen::prelude::*;

// Maximum iterations to prevent infinite loops (50x50 room size)
const MAX_STEPS: usize = 2500;

pub fn path_to_multiroom_distance_map_origin(
    start: Position,
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut current = start;
    let mut steps = 0;

    while steps < MAX_STEPS {
        path.add(current);

        let room_map = match distance_map.get_room_map(current.room_name()) {
            Some(room_map) => room_map,
            None => return Err("No valid path to origin found"),
        };
        let current_distance = room_map[current.xy()];
        if current_distance == 0 {
            // We've reached the origin
            return Ok(path);
        }

        // Find the neighbor with the lowest distance value
        let mut next_pos = None;
        let mut min_distance = current_distance;

        for neighbor in neighbors_without_edges(current, direction_order) {
            let neighbor_distance = room_map[neighbor.xy()];

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

            // if next is a room edge, jump to the corresponding room edge
            if next.is_room_edge() {
                path.add(next);
            }
            current = corresponding_room_edge(next);
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
    use crate::algorithms::distance_map::dijkstra::dijkstra_multiroom_distance_map;
    use crate::datatypes::ClockworkCostMatrix;
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

    fn edge_cost_matrix() -> ClockworkCostMatrix {
        let mut matrix = ClockworkCostMatrix::new(Some(1));
        for x in 1..49 {
            for y in 1..49 {
                matrix.set(
                    screeps::RoomXY::new(
                        RoomCoordinate::new(x).unwrap(),
                        RoomCoordinate::new(y).unwrap(),
                    ),
                    5,
                );
            }
        }
        matrix
    }

    fn path_between(start: Position, target: Position) -> Vec<Position> {
        let distance_map = dijkstra_multiroom_distance_map(
            vec![target],
            |_| Some(edge_cost_matrix()),
            10_000,
            4,
            1_000,
            None,
            None,
        )
        .distance_map();

        let path = path_to_multiroom_distance_map_origin(
            start,
            &distance_map,
            DirectionOrder::CardinalFirst,
        )
        .unwrap();
        (0..path.len()).map(|i| *path.get(i).unwrap()).collect()
    }

    fn assert_path_uses_only_corresponding_edge_transitions(path: &[Position]) {
        for window in path.windows(2) {
            let from = window[0];
            let to = window[1];
            if from.room_name() != to.room_name() {
                assert_eq!(
                    corresponding_room_edge(from),
                    to,
                    "cross-room path step must move to the corresponding edge tile: {:?} -> {:?}",
                    from,
                    to
                );
            }
        }
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

    #[test]
    fn path_follows_bottom_edge_left_to_right() {
        let room_name = "W1N1";
        let path = path_between(pos(7, 48, room_name), pos(14, 48, room_name));

        let edge_8 = pos(8, 49, room_name);
        let edge_9 = pos(9, 49, room_name);
        let edge_10 = pos(10, 49, room_name);
        let edge_11 = pos(11, 49, room_name);
        let edge_12 = pos(12, 49, room_name);
        let edge_13 = pos(13, 49, room_name);
        let expected = [
            pos(7, 48, room_name),
            edge_8,
            corresponding_room_edge(edge_8),
            corresponding_room_edge(edge_9),
            edge_9,
            edge_10,
            corresponding_room_edge(edge_10),
            corresponding_room_edge(edge_11),
            edge_11,
            edge_12,
            corresponding_room_edge(edge_12),
            corresponding_room_edge(edge_13),
            edge_13,
            pos(14, 48, room_name),
        ];

        assert_eq!(path, expected);
        assert_path_uses_only_corresponding_edge_transitions(&path);
    }

    #[test]
    fn path_follows_bottom_edge_right_to_left() {
        let room_name = "W1N1";
        let path = path_between(pos(14, 48, room_name), pos(7, 48, room_name));

        let edge_13 = pos(13, 49, room_name);
        let edge_12 = pos(12, 49, room_name);
        let edge_11 = pos(11, 49, room_name);
        let edge_10 = pos(10, 49, room_name);
        let edge_9 = pos(9, 49, room_name);
        let edge_8 = pos(8, 49, room_name);
        let expected = [
            pos(14, 48, room_name),
            edge_13,
            corresponding_room_edge(edge_13),
            corresponding_room_edge(edge_12),
            edge_12,
            edge_11,
            corresponding_room_edge(edge_11),
            corresponding_room_edge(edge_10),
            edge_10,
            edge_9,
            corresponding_room_edge(edge_9),
            corresponding_room_edge(edge_8),
            edge_8,
            pos(7, 48, room_name),
        ];

        assert_eq!(path, expected);
        assert_path_uses_only_corresponding_edge_transitions(&path);
    }

    #[test]
    fn path_follows_right_edge_top_to_bottom() {
        let room_name = "W1N1";
        let path = path_between(pos(48, 7, room_name), pos(48, 14, room_name));

        let edge_8 = pos(49, 8, room_name);
        let edge_9 = pos(49, 9, room_name);
        let edge_10 = pos(49, 10, room_name);
        let edge_11 = pos(49, 11, room_name);
        let edge_12 = pos(49, 12, room_name);
        let edge_13 = pos(49, 13, room_name);
        let expected = [
            pos(48, 7, room_name),
            edge_8,
            corresponding_room_edge(edge_8),
            corresponding_room_edge(edge_9),
            edge_9,
            edge_10,
            corresponding_room_edge(edge_10),
            corresponding_room_edge(edge_11),
            edge_11,
            edge_12,
            corresponding_room_edge(edge_12),
            corresponding_room_edge(edge_13),
            edge_13,
            pos(48, 14, room_name),
        ];

        assert_eq!(path, expected);
        assert_path_uses_only_corresponding_edge_transitions(&path);
    }

    #[test]
    fn path_follows_right_edge_bottom_to_top() {
        let room_name = "W1N1";
        let path = path_between(pos(48, 14, room_name), pos(48, 7, room_name));

        let edge_13 = pos(49, 13, room_name);
        let edge_12 = pos(49, 12, room_name);
        let edge_11 = pos(49, 11, room_name);
        let edge_10 = pos(49, 10, room_name);
        let edge_9 = pos(49, 9, room_name);
        let edge_8 = pos(49, 8, room_name);
        let expected = [
            pos(48, 14, room_name),
            edge_13,
            corresponding_room_edge(edge_13),
            corresponding_room_edge(edge_12),
            edge_12,
            edge_11,
            corresponding_room_edge(edge_11),
            corresponding_room_edge(edge_10),
            edge_10,
            edge_9,
            corresponding_room_edge(edge_9),
            corresponding_room_edge(edge_8),
            edge_8,
            pos(48, 7, room_name),
        ];

        assert_eq!(path, expected);
        assert_path_uses_only_corresponding_edge_transitions(&path);
    }
}
