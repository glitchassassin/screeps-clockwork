use crate::algorithms::map::{
    preferred_directions, room_xy_neighbors, same_room_neighbor, DirectionOrder,
};
use crate::datatypes::with_configured_portal_index;
use crate::datatypes::MultiroomDistanceMap;
use crate::datatypes::MultiroomFlowField;
use crate::datatypes::PortalIndex;
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

#[wasm_bindgen(js_name = "multiroomPortalFlowField")]
pub fn multiroom_portal_flow_field(
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
) -> MultiroomFlowField {
    set_panic_hook();
    with_configured_portal_index(|portal_index| {
        multiroom_portal_flow_field_with_index(distance_map, direction_order, portal_index)
    })
}

pub fn multiroom_portal_flow_field_with_index(
    distance_map: &MultiroomDistanceMap,
    direction_order: DirectionOrder,
    portal_index: &PortalIndex,
) -> MultiroomFlowField {
    let mut flow_field = MultiroomFlowField::new_with_direction_order(direction_order);

    for room in distance_map.rooms() {
        let room_map = distance_map.get_room_map(room).unwrap();
        for (position, &value) in room_map.enumerate() {
            let pos = Position::new(position.x, position.y, room);
            if value == 0 {
                flow_field.set_terminal(pos);
                continue;
            }

            if value == usize::MAX {
                if portal_index.exit(pos).is_none() && !pos.is_room_edge() {
                    continue;
                }
            }

            let min_distance = preferred_directions(direction_order)
                .iter()
                .filter_map(|direction| same_room_neighbor(pos, *direction))
                .map(|step| distance_map.get(step))
                .min();

            if let Some(min_distance) = min_distance {
                if min_distance != usize::MAX && (min_distance < value || value == usize::MAX) {
                    let directions = preferred_directions(direction_order)
                        .iter()
                        .filter_map(|direction| {
                            let step = same_room_neighbor(pos, *direction)?;
                            if distance_map.get(step) == min_distance {
                                Some(*direction)
                            } else {
                                None
                            }
                        })
                        .collect();
                    flow_field.set_directions(pos, directions);
                }
            }
        }
    }

    flow_field
}
