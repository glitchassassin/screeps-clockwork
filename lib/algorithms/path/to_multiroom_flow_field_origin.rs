use std::collections::HashSet;

use crate::{
    algorithms::map::corresponding_room_edge,
    datatypes::{MultiroomFlowField, Path},
};
use screeps::Position;
use wasm_bindgen::{prelude::*, throw_str, UnwrapThrowExt};

// Maximum iterations to prevent infinite loops
const MAX_STEPS: usize = 10000;

pub fn path_to_multiroom_flow_field_origin(
    start: Position,
    flow_field: &MultiroomFlowField,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;
    path.add(current);

    let mut steps = 0;

    while steps < MAX_STEPS {
        let directions = flow_field.get_directions(current);

        // No valid directions means we've reached the end of the flow field
        if directions.is_empty() {
            return Ok(path);
        }

        // Always take the first available direction
        let next_direction = directions[0];
        let next_pos =
            corresponding_room_edge(current.checked_add_direction(next_direction).unwrap_throw());

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
pub fn js_path_to_multiroom_flow_field_origin(start: u32, flow_field: &MultiroomFlowField) -> Path {
    match path_to_multiroom_flow_field_origin(Position::from_packed(start), flow_field) {
        Ok(path) => path,
        Err(e) => throw_str(&format!(
            "Error calculating path to multiroom flow field origin: {}",
            e
        )),
    }
}
