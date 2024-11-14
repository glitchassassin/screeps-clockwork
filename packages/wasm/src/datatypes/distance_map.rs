use screeps::RoomCoordinate;

/**
 * A distance map is a 50x50 grid (representing a room), representing the distance to
 * the nearest target. This distance may be calculated with arbitrary cost functions,
 * so we're using `usize` instead of `u8` to allow maximum flexibility.
 */
pub struct DistanceMap {
    data: [usize; 2500],
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
        self.data[(y.u8() * 50 + x.u8()) as usize]
    }

    /**
     * Set the distance for a given coordinate.
     */
    pub fn set(&mut self, x: RoomCoordinate, y: RoomCoordinate, value: usize) {
        self.data[(y.u8() * 50 + x.u8()) as usize] = value;
    }
}
