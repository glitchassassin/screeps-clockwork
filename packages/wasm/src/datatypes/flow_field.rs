use screeps::Direction;

/**
 * A flow field is a 50x50 grid (representing a room), representing viable directions
 * to travel to reach a particular target (or targets). A given tile may have multiple
 * equally valid directions, so we represent this as a bitfield.
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
    pub fn get(&self, x: usize, y: usize) -> Option<u8> {
        if x < 50 && y < 50 {
            Some(self.data[y * 50 + x])
        } else {
            None
        }
    }

    /**
     * Set the internal value for a given coordinate.
     */
    pub fn set(&mut self, x: usize, y: usize, value: u8) -> Result<(), &'static str> {
        if x < 50 && y < 50 {
            self.data[y * 50 + x] = value;
            Ok(())
        } else {
            Err("Coordinates out of bounds")
        }
    }

    /**
     * Get the list of valid directions for a given coordinate.
     */
    pub fn get_directions(&self, x: usize, y: usize) -> Result<Vec<Direction>, &'static str> {
        let value = self.get(x, y).ok_or("Coordinates out of bounds")?;
        let mut directions = Vec::new();
        for direction in Direction::iter().cloned() {
            if value & (1 << direction as u8) != 0 {
                directions.push(direction);
            }
        }
        Ok(directions)
    }

    /**
     * Set the list of valid directions for a given coordinate.
     */
    pub fn set_directions(
        &mut self,
        x: usize,
        y: usize,
        directions: Vec<Direction>,
    ) -> Result<(), &'static str> {
        let mut value = 0;
        for direction in directions {
            value |= 1 << direction as u8;
        }
        self.set(x, y, value)
    }
}
