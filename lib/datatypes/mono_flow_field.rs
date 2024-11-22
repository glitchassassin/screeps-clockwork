use screeps::{Direction, RoomCoordinate, RoomXY};
use wasm_bindgen::prelude::*;

/// A flow field is a 50x50 grid (representing a room), representing viable directions
/// to travel to reach a particular target (or targets). A mono flow field only stores
/// a single direction for each tile, so we represent this as 4 bits of an unsigned
/// integer (0 for no direction, 1 for TOP, etc.).
#[wasm_bindgen]
pub struct MonoFlowField {
    data: [u8; 1250],
}

impl MonoFlowField {
    /// Create a new flow field.
    pub fn new() -> Self {
        MonoFlowField { data: [0; 1250] }
    }

    /// Get the direction for a given coordinate.
    pub fn get(&self, pos: RoomXY) -> Option<Direction> {
        let index = (pos.y.u8() as usize) * 50 + (pos.x.u8() as usize);
        let nibble = index / 2;
        let offset = (index % 2) * 4;
        let value = (self.data[nibble] >> offset) & 0b1111;
        match value {
            0 => None,
            1 => Some(Direction::Top),
            2 => Some(Direction::TopRight),
            3 => Some(Direction::Right),
            4 => Some(Direction::BottomRight),
            5 => Some(Direction::Bottom),
            6 => Some(Direction::BottomLeft),
            7 => Some(Direction::Left),
            8 => Some(Direction::TopLeft),
            _ => wasm_bindgen::throw_str(&format!("Invalid direction value: {}", value)),
        }
    }

    /// Set the direction for a given coordinate.
    pub fn set(&mut self, pos: RoomXY, value: Option<Direction>) {
        let index = (pos.y.u8() as usize) * 50 + (pos.x.u8() as usize);
        let nibble = index / 2;
        let offset = (index % 2) * 4;
        let value = value.map(|v| v as u8).unwrap_or(0);
        self.data[nibble] = (self.data[nibble] & !(0b1111 << offset)) | (value << offset);
    }
}

#[wasm_bindgen]
impl MonoFlowField {
    /// Get the direction for a given coordinate.
    #[wasm_bindgen(js_name = get)]
    pub fn js_get(&self, x: u8, y: u8) -> Option<Direction> {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.get(RoomXY::new(x, y))
    }

    /// Set the direction for a given coordinate.
    #[wasm_bindgen(js_name = set)]
    pub fn js_set(&mut self, x: u8, y: u8, value: Option<Direction>) {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.set(RoomXY::new(x, y), value);
    }
}
