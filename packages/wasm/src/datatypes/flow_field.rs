use screeps::{Direction, RoomCoordinate};

/**
 * A flow field is a 50x50 grid (representing a room), representing viable directions
 * to travel to reach a particular target (or targets). A given tile may have multiple
 * equally valid directions, so we represent this as a bitfield (where each bit in an
 * 8-bit unsigned integer represents a direction that is either viable or not).
 */
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
}
