use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Default,PartialEq)]
pub enum PathPreferenceGonality {
    #[default]
    None,
    Orthogonal,
    Diagonal
}

#[wasm_bindgen]
#[derive(Default,PartialEq)]
pub enum PathPreferenceTurns {
    #[default]
    None,
    Straight,
    Zigzag
}
