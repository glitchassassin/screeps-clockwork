mod algorithms;
mod datatypes;
mod helpers;
mod utils;

#[cfg(feature = "bench")]
pub mod bench_support {
    pub use crate::algorithms::distance_map::astar::astar_multiroom_distance_map;
    pub use crate::algorithms::distance_map::breadth_first_search::bfs_multiroom_distance_map;
    pub use crate::algorithms::distance_map::dijkstra::dijkstra_multiroom_distance_map;
    pub use crate::algorithms::distance_map::heuristics::base_heuristic_with_range;
    pub use crate::datatypes::ClockworkCostMatrix;
}

use screeps::Position;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Exports the global range calculation between two positions.
#[wasm_bindgen]
pub fn get_range(packed_pos_1: u32, packed_pos_2: u32) -> u32 {
    let pos1 = Position::from_packed(packed_pos_1);
    let pos2 = Position::from_packed(packed_pos_2);
    pos1.get_range_to(pos2)
}
