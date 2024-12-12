use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::MultiroomMonoFlowField;
use crate::utils::set_panic_hook;
use screeps::Position;
use wasm_bindgen::prelude::*;

/// Creates a monodirectional flow field for the given distance map.
#[wasm_bindgen(js_name = "multiroomMonoFlowField")]
pub fn multiroom_mono_flow_field(distance_map: MultiroomDistanceMap) -> MultiroomMonoFlowField {
    set_panic_hook();
    let mut flow_field = MultiroomMonoFlowField::new();

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
                    let direction = position
                        .neighbors()
                        .iter()
                        .filter(|neighbor| room_map[**neighbor] == min_distance)
                        .map(|neighbor| position.get_direction_to(*neighbor).unwrap())
                        .next();
                    flow_field.set(Position::new(position.x, position.y, room), direction);
                }
            }
        }
    }

    flow_field
}
