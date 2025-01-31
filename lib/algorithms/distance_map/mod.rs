use screeps::Position;
use wasm_bindgen::prelude::wasm_bindgen;

use crate::datatypes::MultiroomDistanceMap;

pub mod astar;
pub mod breadth_first_search;
pub mod dijkstra;
pub mod heuristics;

/// A distance map search returns both the distance map (filled out
/// with all tiles explored) and the targets found. These aren't necessarily
/// the same positions specified as targets - if the target range is 5, then
/// this is the first position in range 5 of the target. If multiple targets
/// are specified, and you care about matching the found target with one of
/// the original targets, you can iterate through your list and figure out the
/// ones that are in range of the found target(s).
#[wasm_bindgen]
pub struct SearchResult {
    distance_map: MultiroomDistanceMap,
    found_targets: Vec<Position>,
    ops: usize,
}

impl SearchResult {
    pub fn new(
        distance_map: MultiroomDistanceMap,
        found_targets: Vec<Position>,
        ops: usize,
    ) -> Self {
        Self {
            distance_map,
            found_targets,
            ops,
        }
    }
}

#[wasm_bindgen]
impl SearchResult {
    #[wasm_bindgen(getter)]
    pub fn distance_map(&self) -> MultiroomDistanceMap {
        self.distance_map.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn found_targets(&self) -> Vec<u32> {
        self.found_targets
            .iter()
            .map(|pos| pos.packed_repr())
            .collect()
    }

    #[wasm_bindgen(getter)]
    pub fn ops(&self) -> usize {
        self.ops
    }
}
