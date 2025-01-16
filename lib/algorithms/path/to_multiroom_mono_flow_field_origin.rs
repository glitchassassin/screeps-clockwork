use std::collections::HashSet;

use crate::{
    algorithms::map::corresponding_room_edge,
    datatypes::{MultiroomMonoFlowField, Path},
};
use screeps::Position;
use wasm_bindgen::{prelude::*, throw_str, UnwrapThrowExt};

// Maximum iterations to prevent infinite loops
const MAX_STEPS: usize = 10000;

pub fn path_to_multiroom_mono_flow_field_origin(
    start: Position,
    flow_field: &MultiroomMonoFlowField,
) -> Result<Path, &'static str> {
    let mut path = Path::new();
    let mut visited = HashSet::new();
    let mut current = start;

    let mut steps = 0;

    while steps < MAX_STEPS {
        path.add(current);

        let next_direction = flow_field.get(current);

        // No direction means we've reached the end of the flow field
        let direction = match next_direction {
            None => return Ok(path),
            Some(direction) => direction,
        };

        let next_pos = current.checked_add_direction(direction).unwrap_throw();

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
pub fn js_path_to_multiroom_mono_flow_field_origin(
    start: u32,
    flow_field: &MultiroomMonoFlowField,
) -> Path {
    match path_to_multiroom_mono_flow_field_origin(Position::from_packed(start), flow_field) {
        Ok(path) => path,
        Err(e) => throw_str(&format!(
            "Error calculating path to multiroom mono flow field origin: {}",
            e
        )),
    }
}
