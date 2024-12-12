use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::MultiroomFlowField;
use crate::utils::set_panic_hook;
use screeps::Position;
use wasm_bindgen::prelude::*;

/// Creates a flow field for the given distance map.
#[wasm_bindgen(js_name = "multiroomFlowField")]
pub fn multiroom_flow_field(distance_map: MultiroomDistanceMap) -> MultiroomFlowField {
    set_panic_hook();
    let mut flow_field = MultiroomFlowField::new();

    for room in distance_map.rooms() {
        let room_map = distance_map.get_room_map(room).unwrap();
        for (position, &value) in room_map.enumerate() {
            if value == usize::MAX {
                continue; // unreachable
            }
            let min_distance = position
                .neighbors()
                .iter()
                .map(|neighbor| room_map[*neighbor])
                .min();
            if let Some(min_distance) = min_distance {
                if min_distance < value {
                    let directions = position
                        .neighbors()
                        .iter()
                        .filter(|neighbor| room_map[**neighbor] == min_distance)
                        .map(|neighbor| position.get_direction_to(*neighbor).unwrap())
                        .collect();
                    flow_field
                        .set_directions(Position::new(position.x, position.y, room), directions);
                }
            }
        }
    }

    flow_field
}
