use screeps::{LocalCostMatrix, RoomCoordinate, RoomXY};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct ClockworkCostMatrix {
    internal: LocalCostMatrix,
}

#[wasm_bindgen]
impl ClockworkCostMatrix {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ClockworkCostMatrix {
        ClockworkCostMatrix {
            internal: LocalCostMatrix::new(),
        }
    }

    #[wasm_bindgen]
    pub fn get(&self, x: u8, y: u8) -> u8 {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.internal.get(RoomXY::new(x, y))
    }

    #[wasm_bindgen]
    pub fn set(&mut self, x: u8, y: u8, value: u8) {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.internal.set(RoomXY::new(x, y), value);
    }
}

impl ClockworkCostMatrix {
    pub fn get_internal(&self) -> &LocalCostMatrix {
        &self.internal
    }
}
