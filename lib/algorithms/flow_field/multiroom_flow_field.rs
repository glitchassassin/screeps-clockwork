use crate::algorithms::map::{room_xy_neighbors, DirectionOrder};
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::MultiroomFlowField;
use crate::utils::set_panic_hook;
use screeps::Position;
use wasm_bindgen::prelude::*;

/// Creates a flow field for the given distance map.
#[wasm_bindgen(js_name = "multiroomFlowField")]
pub fn multiroom_flow_field(
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
) -> MultiroomFlowField {
    set_panic_hook();
    let mut flow_field = MultiroomFlowField::new_with_direction_order(direction_order);

    for room in distance_map.rooms() {
        let room_map = distance_map.get_room_map(room).unwrap();
        for (position, &value) in room_map.enumerate() {
            if value == usize::MAX {
                continue; // unreachable
            }
            let min_distance = room_xy_neighbors(position, direction_order)
                .map(|neighbor| room_map[neighbor])
                .min();
            if let Some(min_distance) = min_distance {
                if min_distance < value {
                    let directions = room_xy_neighbors(position, direction_order)
                        .filter(|neighbor| room_map[*neighbor] == min_distance)
                        .map(|neighbor| position.get_direction_to(neighbor).unwrap())
                        .collect();
                    flow_field
                        .set_directions(Position::new(position.x, position.y, room), directions);
                }
            }
        }
    }

    flow_field
}
