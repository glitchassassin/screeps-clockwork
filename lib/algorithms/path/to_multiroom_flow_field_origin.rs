use std::collections::HashSet;

use crate::{
    algorithms::map::corresponding_room_edge,
    datatypes::{with_configured_portal_index, MultiroomFlowField, Path, PortalIndex},
};
use screeps::Position;
use wasm_bindgen::prelude::*;

// Maximum iterations to prevent infinite loops
const MAX_STEPS: usize = 2500;

pub fn path_to_multiroom_flow_field_origin(
    start: Position,
    flow_field: &MultiroomFlowField,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;

    let mut steps = 0;

    while steps < MAX_STEPS {
        path.add(current);
        if flow_field.is_terminal(current) {
            return Ok(path);
        }

        let next_direction = match flow_field
            .get_room_map(current.room_name())
            .and_then(|map| map.get_first_direction(current.x(), current.y()))
        {
            // No valid directions means we've reached the end of the flow field
            None => return Ok(path),
            // Always take the first available direction
            Some(direction) => direction,
        };
        let next_pos = current
            .checked_add_direction(next_direction)
            .map_err(|_| "Direction points outside room bounds")?;

        // Check if we've already visited this position
        if visited.contains(&next_pos) {
            return Err("Cycle detected in flow field");
        }

        if next_pos.is_room_edge() {
            path.add(next_pos);
        }
        current = corresponding_room_edge(next_pos);
        visited.insert(current);

        steps += 1;
    }

    Err("Path exceeded maximum length")
}

pub fn path_to_multiroom_flow_field_origin_with_portals(
    start: Position,
    flow_field: &MultiroomFlowField,
    portal_index: &PortalIndex,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;

    let mut steps = 0;

    while steps < MAX_STEPS {
        path.add(current);
        if flow_field.is_terminal(current) {
            return Ok(path);
        }

        let next_direction = match flow_field
            .get_room_map(current.room_name())
            .and_then(|map| map.get_first_direction(current.x(), current.y()))
        {
            None => {
                if let Some(portal_exit) = portal_index.exit(current) {
                    if !visited.insert(portal_exit) {
                        return Err("Cycle detected in flow field");
                    }
                    current = portal_exit;
                    steps += 1;
                    continue;
                }
                if current.is_room_edge() {
                    let room_exit = corresponding_room_edge(current);
                    if !visited.insert(room_exit) {
                        return Err("Cycle detected in flow field");
                    }
                    current = room_exit;
                    steps += 1;
                    continue;
                }
                return Ok(path);
            }
            Some(direction) => direction,
        };
        let next_pos = current
            .checked_add_direction(next_direction)
            .map_err(|_| "Direction points outside room bounds")?;

        if visited.contains(&next_pos) {
            return Err("Cycle detected in flow field");
        }

        if flow_field.is_terminal(next_pos) {
            path.add(next_pos);
            return Ok(path);
        }

        if portal_index.exit(next_pos).is_some() || next_pos.is_room_edge() {
            path.add(next_pos);
        }
        current = portal_index
            .exit(next_pos)
            .unwrap_or_else(|| corresponding_room_edge(next_pos));
        visited.insert(current);

        steps += 1;
    }

    Err("Path exceeded maximum length")
}

#[wasm_bindgen]
pub fn js_path_to_multiroom_flow_field_origin(
    start: u32,
    flow_field: &MultiroomFlowField,
) -> Result<Path, JsValue> {
    match path_to_multiroom_flow_field_origin(Position::from_packed(start), flow_field) {
        Ok(path) => Ok(path),
        Err(e) => Err(js_sys::Error::new(&format!(
            "Error calculating path to multiroom flow field origin: {}",
            e
        ))
        .into()),
    }
}

#[wasm_bindgen]
pub fn js_path_to_multiroom_flow_field_origin_with_portals(
    start: u32,
    flow_field: &MultiroomFlowField,
) -> Result<Path, JsValue> {
    match with_configured_portal_index(|portal_index| {
        path_to_multiroom_flow_field_origin_with_portals(
            Position::from_packed(start),
            flow_field,
            portal_index,
        )
    }) {
        Ok(path) => Ok(path),
        Err(e) => Err(js_sys::Error::new(&format!(
            "Error calculating portal path to multiroom flow field origin: {}",
            e
        ))
        .into()),
    }
}
