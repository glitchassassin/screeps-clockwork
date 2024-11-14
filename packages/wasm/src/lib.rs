mod algorithms;
mod datatypes;
mod utils;

pub use algorithms::breadth_first_search;
pub use datatypes::DistanceMap;
pub use datatypes::FlowField;
pub use datatypes::Path;
use screeps::Position;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    log("Hello, screeps-clockwork 1.0!");
}

#[wasm_bindgen]
pub fn get_range(packed_pos_1: u32, packed_pos_2: u32) -> u32 {
    let pos1 = Position::from_packed(packed_pos_1);
    let pos2 = Position::from_packed(packed_pos_2);
    pos1.get_range_to(pos2)
}
