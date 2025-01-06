use super::types::MapPosition;

pub struct RoomInfo {
    pub terrain: Vec<u8>,
    pub cost_matrix: Vec<Vec<u8>>,
    pub pos: MapPosition,
}

impl RoomInfo {
    pub fn new(terrain: Vec<u8>, cost_matrix: Option<Vec<Vec<u8>>>, pos: MapPosition) -> Self {
        let cost_matrix = cost_matrix.unwrap_or_else(|| vec![vec![0; 50]; 50]);
        Self {
            terrain,
            cost_matrix,
            pos,
        }
    }

    pub fn look(&self, xx: u8, yy: u8) -> u8 {
        if self.cost_matrix[xx as usize][yy as usize] != 0 {
            return self.cost_matrix[xx as usize][yy as usize];
        }
        let index = (xx as usize) * 50 + (yy as usize);
        0x03 & (self.terrain[index / 4] >> ((index % 4) * 2))
    }
}
