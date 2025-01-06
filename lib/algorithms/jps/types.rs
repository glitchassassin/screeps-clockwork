use screeps::{Position, RoomCoordinate, RoomName};
use std::hash::{Hash, Hasher};

pub type Cost = u32;
pub type PosIndex = u32;
pub type RoomIndex = u32;

pub const MAX_ROOMS: usize = 64;
pub const OBSTACLE: Cost = Cost::MAX;

#[derive(Clone, Copy, Debug, Eq)]
pub struct MapPosition {
    pub xx: u8,
    pub yy: u8,
}

impl MapPosition {
    pub fn new(xx: u8, yy: u8) -> Self {
        Self { xx, yy }
    }

    pub fn id(&self) -> u16 {
        ((self.xx as u16) << 8) | (self.yy as u16)
    }
}

impl PartialEq for MapPosition {
    fn eq(&self, other: &Self) -> bool {
        self.id() == other.id()
    }
}

impl Hash for MapPosition {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.id().hash(state);
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct WorldPosition {
    pub xx: u32,
    pub yy: u32,
}

#[derive(Debug, Copy, Clone)]
pub enum Direction {
    Top,
    TopRight,
    Right,
    BottomRight,
    Bottom,
    BottomLeft,
    Left,
    TopLeft,
}

impl WorldPosition {
    pub fn new(xx: u32, yy: u32) -> Self {
        Self { xx, yy }
    }

    pub fn position_in_direction(&self, dir: Direction) -> Self {
        match dir {
            Direction::Top => Self::new(self.xx, self.yy.saturating_sub(1)),
            Direction::TopRight => Self::new(self.xx + 1, self.yy.saturating_sub(1)),
            Direction::Right => Self::new(self.xx + 1, self.yy),
            Direction::BottomRight => Self::new(self.xx + 1, self.yy + 1),
            Direction::Bottom => Self::new(self.xx, self.yy + 1),
            Direction::BottomLeft => Self::new(self.xx.saturating_sub(1), self.yy + 1),
            Direction::Left => Self::new(self.xx.saturating_sub(1), self.yy),
            Direction::TopLeft => Self::new(self.xx.saturating_sub(1), self.yy.saturating_sub(1)),
        }
    }

    pub fn direction_to(&self, pos: WorldPosition) -> Option<Direction> {
        let dx = pos.xx as i32 - self.xx as i32;
        let dy = pos.yy as i32 - self.yy as i32;

        match (dx.signum(), dy.signum()) {
            (1, 1) => Some(Direction::BottomRight),
            (1, -1) => Some(Direction::TopRight),
            (1, 0) => Some(Direction::Right),
            (-1, 1) => Some(Direction::BottomLeft),
            (-1, -1) => Some(Direction::TopLeft),
            (-1, 0) => Some(Direction::Left),
            (0, 1) => Some(Direction::Bottom),
            (0, -1) => Some(Direction::Top),
            _ => None,
        }
    }

    pub fn range_to(&self, pos: WorldPosition) -> Cost {
        let dx = if pos.xx > self.xx {
            pos.xx - self.xx
        } else {
            self.xx - pos.xx
        };
        let dy = if pos.yy > self.yy {
            pos.yy - self.yy
        } else {
            self.yy - pos.yy
        };
        dx.max(dy)
    }

    pub fn map_position(&self) -> MapPosition {
        MapPosition::new((self.xx / 50) as u8, (self.yy / 50) as u8)
    }
}

impl From<Position> for WorldPosition {
    fn from(pos: Position) -> Self {
        let world_x = (pos.room_name().x_coord() + 128) as u32 * 50 + pos.x().u8() as u32;
        let world_y = (pos.room_name().y_coord() + 128) as u32 * 50 + pos.y().u8() as u32;
        WorldPosition::new(world_x, world_y)
    }
}

impl From<WorldPosition> for Position {
    fn from(pos: WorldPosition) -> Self {
        let room_x = (pos.xx / 50) as u16;
        let room_y = (pos.yy / 50) as u16;
        let x = (pos.xx % 50) as u8;
        let y = (pos.yy % 50) as u8;

        // SAFETY: x and y are guaranteed to be < 50 from the modulo operation
        let x_coord = unsafe { RoomCoordinate::unchecked_new(x) };
        let y_coord = unsafe { RoomCoordinate::unchecked_new(y) };

        Position::new(
            x_coord,
            y_coord,
            RoomName::from_packed((room_x << 8) | room_y),
        )
    }
}
