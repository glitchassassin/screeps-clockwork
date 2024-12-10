use std::collections::HashSet;

use crate::datatypes::{MonoFlowField, Path};
use screeps::{Position, RoomXY};
use wasm_bindgen::{prelude::*, throw_str, UnwrapThrowExt};

// Maximum iterations to prevent infinite loops
const MAX_STEPS: usize = 2500;

pub fn path_to_mono_flow_field_origin(
    start: Position,
    flow_field: &MonoFlowField,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;
    path.add(current);

    let mut steps = 0;

    while steps < MAX_STEPS {
        let next_direction = flow_field.get(RoomXY::from(current));

        // No valid directions means we've reached the end of the flow field
        let direction = match next_direction {
            None => return Ok(path),
            Some(direction) => direction,
        };

        let next_pos = current.checked_add_direction(direction).unwrap_throw();

        // Check if we've already visited this position
        if visited.contains(&next_pos) {
            return Err("Cycle detected in flow field");
        }

        current = next_pos;
        path.add(current);
        visited.insert(current);

        steps += 1;
    }

    Err("Path exceeded maximum length")
}

#[wasm_bindgen]
pub fn js_path_to_mono_flow_field_origin(start: u32, flow_field: &MonoFlowField) -> Path {
    match path_to_mono_flow_field_origin(Position::from_packed(start), flow_field) {
        Ok(path) => path,
        Err(e) => throw_str(&format!(
            "Error calculating path to mono flow field origin: {}",
            e
        )),
    }
}
