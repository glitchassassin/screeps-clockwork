use std::collections::HashSet;

use crate::datatypes::{FlowField, Path};
use screeps::Position;
use wasm_bindgen::{prelude::*, UnwrapThrowExt};

pub fn to_flow_field_origin(start: Position, flow_field: &FlowField) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;
    path.add(current);

    // Maximum iterations to prevent infinite loops (50x50 room size)
    const MAX_STEPS: usize = 2500;
    let mut steps = 0;

    while steps < MAX_STEPS {
        let directions = flow_field.get_directions(current.x(), current.y());

        // No valid directions means we've reached the end of the flow field
        if directions.is_empty() {
            return Ok(path);
        }

        // Always take the first available direction
        let next_direction = directions[0];
        let next_pos = current.checked_add_direction(next_direction).unwrap_throw();

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
pub fn js_to_flow_field_origin(start: u32, flow_field: &FlowField) -> Path {
    to_flow_field_origin(Position::from_packed(start), flow_field).unwrap_throw()
}