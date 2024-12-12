use screeps::RoomXY;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::datatypes::{DistanceMap, MonoFlowField};

/// Creates a flow field for the given distance map.
#[wasm_bindgen(js_name = "monoFlowField")]
pub fn mono_flow_field(distance_map: DistanceMap) -> MonoFlowField {
    let mut flow_field = MonoFlowField::new();

    for (position, &value) in distance_map.enumerate() {
        if value == usize::MAX {
            continue; // unreachable
        }
        let neighbors: Vec<RoomXY> = position
            .neighbors()
            .into_iter()
            // Cannot move to an edge tile unless it's a target AND the source is not also an edge tile
            .filter(|neighbor| {
                !neighbor.is_room_edge()
                    || (!position.is_room_edge() && distance_map[*neighbor] == 0)
            })
            .collect();
        let min_distance = neighbors
            .iter()
            .map(|neighbor| distance_map[*neighbor])
            .min();
        if let Some(min_distance) = min_distance {
            if min_distance < value {
                let direction = neighbors
                    .iter()
                    .filter(|neighbor| distance_map[**neighbor] == min_distance)
                    .map(|neighbor| position.get_direction_to(*neighbor).unwrap())
                    .next();
                flow_field.set(position, direction);
            }
        }
    }

    flow_field
}
