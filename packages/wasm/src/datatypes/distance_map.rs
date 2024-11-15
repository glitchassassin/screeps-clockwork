use screeps::RoomCoordinate;
use wasm_bindgen::prelude::*;

/**
 * A distance map is a 50x50 grid (representing a room), representing the distance to
 * the nearest target. This distance may be calculated with arbitrary cost functions,
 * so we're using `usize` instead of `u8` to allow maximum flexibility.
 */
#[wasm_bindgen]
pub struct DistanceMap {
    data: [usize; 2500],
}

impl<'a> IntoIterator for &'a DistanceMap {
    type Item = &'a usize;
    type IntoIter = std::slice::Iter<'a, usize>;

    fn into_iter(self) -> Self::IntoIter {
        self.data.iter()
    }
}

impl DistanceMap {
    /**
     * Create a new distance map.
     */
    pub fn new() -> Self {
        DistanceMap { data: [0; 2500] }
    }

    /**
     * Get the distance for a given coordinate.
     */
    pub fn get(&self, x: RoomCoordinate, y: RoomCoordinate) -> usize {
        self.data[(y.u8() as usize) * 50 + (x.u8() as usize)]
    }

    /**
     * Set the distance for a given coordinate.
     */
    pub fn set(&mut self, x: RoomCoordinate, y: RoomCoordinate, value: usize) {
        self.data[(y.u8() as usize) * 50 + (x.u8() as usize)] = value;
    }
}

#[wasm_bindgen]
impl DistanceMap {
    #[wasm_bindgen(js_name = toArray)]
    pub fn to_array(&self) -> Vec<usize> {
        self.data.to_vec()
    }
}
