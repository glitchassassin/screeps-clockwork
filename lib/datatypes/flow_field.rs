use screeps::{Direction, RoomCoordinate};
use wasm_bindgen::prelude::*;

/**
 * A flow field is a 50x50 grid (representing a room), representing viable directions
 * to travel to reach a particular target (or targets). A given tile may have multiple
 * equally valid directions, so we represent this as a bitfield (where each bit in an
 * 8-bit unsigned integer represents a direction that is either viable or not).
 */
#[wasm_bindgen]
pub struct FlowField {
    data: [u8; 2500],
}

impl FlowField {
    /**
     * Create a new flow field.
     */
    pub fn new() -> Self {
        FlowField { data: [0; 2500] }
    }

    /**
     * Get the internal value for a given coordinate.
     */
    pub fn get(&self, x: RoomCoordinate, y: RoomCoordinate) -> u8 {
        self.data[(y.u8() as usize) * 50 + (x.u8() as usize)]
    }

    /**
     * Set the internal value for a given coordinate.
     */
    pub fn set(&mut self, x: RoomCoordinate, y: RoomCoordinate, value: u8) {
        self.data[(y.u8() as usize) * 50 + (x.u8() as usize)] = value;
    }

    /**
     * Get the list of valid directions for a given coordinate.
     */
    pub fn get_directions(&self, x: RoomCoordinate, y: RoomCoordinate) -> Vec<Direction> {
        let value = self.get(x, y);
        let mut directions = Vec::new();
        for direction in Direction::iter().cloned() {
            if value & (1 << direction as u8) != 0 {
                directions.push(direction);
            }
        }
        directions
    }

    /**
     * Set the list of valid directions for a given coordinate.
     */
    pub fn set_directions(
        &mut self,
        x: RoomCoordinate,
        y: RoomCoordinate,
        directions: Vec<Direction>,
    ) {
        let mut value = 0;
        for direction in directions {
            value |= 1 << direction as u8;
        }
        self.set(x, y, value)
    }

    pub fn add_direction(&mut self, x: RoomCoordinate, y: RoomCoordinate, direction: Direction) {
        let value = self.get(x, y);
        self.set(x, y, value | (1 << direction as u8));
    }
}

#[wasm_bindgen]
impl FlowField {
    /**
     * Get the internal value for a given coordinate.
     */
    #[wasm_bindgen(js_name = get)]
    pub fn js_get(&self, x: u8, y: u8) -> u8 {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.get(x, y)
    }

    /**
     * Set the internal value for a given coordinate.
     */
    #[wasm_bindgen(js_name = set)]
    pub fn js_set(&mut self, x: u8, y: u8, value: u8) {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.set(x, y, value);
    }

    /**
     * Get the list of valid directions for a given coordinate.
     */
    #[wasm_bindgen(js_name = getDirections)]
    pub fn js_get_directions(&self, x: u8, y: u8) -> Vec<Direction> {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.get_directions(x, y)
    }

    /**
     * Set the list of valid directions for a given coordinate.
     */
    #[wasm_bindgen(js_name = setDirections)]
    pub fn js_set_directions(&mut self, x: u8, y: u8, directions: Vec<Direction>) {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.set_directions(x, y, directions);
    }

    #[wasm_bindgen(js_name = addDirection)]
    pub fn js_add_direction(&mut self, x: u8, y: u8, direction: Direction) {
        let x = RoomCoordinate::new(x)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid x coordinate: {}", x)));
        let y = RoomCoordinate::new(y)
            .unwrap_or_else(|_| wasm_bindgen::throw_str(&format!("Invalid y coordinate: {}", y)));
        self.add_direction(x, y, direction);
    }
}
