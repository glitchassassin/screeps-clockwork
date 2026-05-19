use std::collections::HashSet;

use crate::{
    algorithms::map::corresponding_room_edge,
    datatypes::{MultiroomFlowField, Path},
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
