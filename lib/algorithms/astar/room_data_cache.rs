use crate::datatypes::ClockworkCostMatrix;
use crate::datatypes::MultiroomDistanceMap;
use crate::DistanceMap;
use screeps::RoomName;
use std::collections::HashMap;
use std::ops::Fn;
use std::ops::Index;
use std::ops::IndexMut;

#[derive(Clone)]
pub struct RoomData {
    pub cost_matrix: Option<ClockworkCostMatrix>,
    pub distance_map: DistanceMap,
    pub room_name: RoomName,
}

pub struct RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    room_data: Vec<RoomData>,
    room_map: HashMap<RoomName, usize>,
    cost_matrix_creator: F,
}

impl<F> RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    pub fn new(cost_matrix_creator: F) -> Self {
        Self {
            room_data: vec![],
            room_map: HashMap::new(),
            cost_matrix_creator,
        }
    }

    pub fn get_room_key(&mut self, room: RoomName) -> usize {
        if let Some(room_key) = self.room_map.get(&room) {
            return *room_key;
        }
        self.room_data.push(RoomData {
            cost_matrix: (self.cost_matrix_creator)(room),
            distance_map: DistanceMap::new(),
            room_name: room,
        });
        self.room_map.insert(room, self.room_data.len() - 1);
        self.room_data.len() - 1
    }
}

impl<F> Index<usize> for RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    type Output = RoomData;

    fn index(&self, index: usize) -> &Self::Output {
        &self.room_data[index]
    }
}

impl<F> IndexMut<usize> for RoomDataCache<F>
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    fn index_mut(&mut self, index: usize) -> &mut Self::Output {
        &mut self.room_data[index]
    }
}

impl<F> From<RoomDataCache<F>> for MultiroomDistanceMap
where
    F: Fn(RoomName) -> Option<ClockworkCostMatrix>,
{
    fn from(cached_room_data: RoomDataCache<F>) -> Self {
        let mut maps = HashMap::new();
        for room_data in cached_room_data.room_data {
            maps.insert(room_data.room_name, room_data.distance_map);
        }
        MultiroomDistanceMap { maps }
    }
}
