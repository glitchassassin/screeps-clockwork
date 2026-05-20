use crate::algorithms::map::{
    preferred_directions, room_xy_neighbors, same_room_neighbor, DirectionOrder,
};
use crate::datatypes::with_configured_portal_index;
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::MultiroomMonoFlowField;
use crate::datatypes::PortalIndex;
use crate::utils::set_panic_hook;
use screeps::Position;
use wasm_bindgen::prelude::*;

/// Creates a monodirectional flow field for the given distance map.
#[wasm_bindgen(js_name = "multiroomMonoFlowField")]
pub fn multiroom_mono_flow_field(
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
) -> MultiroomMonoFlowField {
    set_panic_hook();
    let mut flow_field = MultiroomMonoFlowField::new();

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
                    let direction = room_xy_neighbors(position, direction_order)
                        .find(|neighbor| room_map[*neighbor] == min_distance)
                        .map(|neighbor| position.get_direction_to(neighbor).unwrap());
                    flow_field.set(Position::new(position.x, position.y, room), direction);
                }
            }
        }
    }

    flow_field
}

#[wasm_bindgen(js_name = "multiroomPortalMonoFlowField")]
pub fn multiroom_portal_mono_flow_field(
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
) -> MultiroomMonoFlowField {
    set_panic_hook();
    with_configured_portal_index(|portal_index| {
        multiroom_portal_mono_flow_field_with_index(distance_map, direction_order, portal_index)
    })
}

pub fn multiroom_portal_mono_flow_field_with_index(
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
    portal_index: &PortalIndex,
) -> MultiroomMonoFlowField {
    let mut flow_field = MultiroomMonoFlowField::new();

    for room in distance_map.rooms() {
        let room_map = distance_map.get_room_map(room).unwrap();
        for (position, &value) in room_map.enumerate() {
            if value == usize::MAX {
                let pos = Position::new(position.x, position.y, room);
                if portal_index.exit(pos).is_none() && !pos.is_room_edge() {
                    continue;
                }
            }

            let pos = Position::new(position.x, position.y, room);
            let min_distance = preferred_directions(direction_order)
                .iter()
                .filter_map(|direction| same_room_neighbor(pos, *direction))
                .map(|step| distance_map.get(step))
                .min();

            if let Some(min_distance) = min_distance {
                if min_distance != usize::MAX && (min_distance < value || value == usize::MAX) {
                    let direction =
                        preferred_directions(direction_order)
                            .iter()
                            .find_map(|direction| {
                                let step = same_room_neighbor(pos, *direction)?;
                                if distance_map.get(step) == min_distance {
                                    Some(*direction)
                                } else {
                                    None
                                }
                            });
                    flow_field.set(pos, direction);
                }
            }
        }
    }

    flow_field
}
