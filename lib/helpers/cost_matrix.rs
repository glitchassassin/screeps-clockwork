use screeps::{LocalCostMatrix, RoomCoordinate, RoomXY};
use wasm_bindgen::prelude::*;

/// A wrapper around the `LocalCostMatrix` type from the Screeps API.
/// Instances can be passed between WASM and JS as a pointer, using the
/// methods to get and set values, rather than copying the entire matrix.
#[wasm_bindgen]
pub struct ClockworkCostMatrix {
    internal: LocalCostMatrix,
}

#[wasm_bindgen]
impl ClockworkCostMatrix {
    /// Creates a new cost matrix within the WASM module.
    #[wasm_bindgen(constructor)]
    pub fn new() -> ClockworkCostMatrix {
        ClockworkCostMatrix {
            internal: LocalCostMatrix::new(),
        }
    }

    /// Gets the cost of a given position in the cost matrix.
    #[wasm_bindgen]
    pub fn get(&self, x: u8, y: u8) -> u8 {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.internal.get(RoomXY::new(x, y))
    }

    /// Sets the cost of a given position in the cost matrix.
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
    /// Gets the internal `LocalCostMatrix` instance from the wrapper.
    pub fn get_internal(&self) -> &LocalCostMatrix {
        &self.internal
    }
}
