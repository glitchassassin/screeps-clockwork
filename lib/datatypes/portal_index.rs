use screeps::constants::extra::{ROOM_AREA, ROOM_SIZE};
use screeps::{xy_to_linear_index, Position, RoomCoordinate, RoomName};
use std::cell::RefCell;
use std::collections::{HashMap, VecDeque};
use std::mem::size_of;
use wasm_bindgen::prelude::*;

const DEFAULT_DISTANCE_CACHE_ROOM_LIMIT: usize = 512;

#[derive(Clone, Debug)]
struct PortalRoomSummary {
    portals: Vec<Position>,
}

#[derive(Debug)]
pub struct PortalIndex {
    exit_by_entry: HashMap<Position, Position>,
    rooms: HashMap<RoomName, PortalRoomSummary>,
    nearest_endpoint_room_map_cache: RefCell<RoomMapLruCache>,
}

#[derive(Debug)]
struct RoomMapLruCache {
    limit: usize,
    entries: HashMap<RoomName, Vec<usize>>,
    recency: VecDeque<RoomName>,
}

thread_local! {
    static CONFIGURED_PORTALS: RefCell<PortalIndex> = RefCell::new(PortalIndex::default());
}

impl Clone for PortalIndex {
    fn clone(&self) -> Self {
        Self {
            exit_by_entry: self.exit_by_entry.clone(),
            rooms: self.rooms.clone(),
            nearest_endpoint_room_map_cache: RefCell::new(RoomMapLruCache::new(
                self.distance_cache_room_limit(),
            )),
        }
    }
}

impl Default for PortalIndex {
    fn default() -> Self {
        Self::with_distance_cache_room_limit(DEFAULT_DISTANCE_CACHE_ROOM_LIMIT)
    }
}

impl PortalIndex {
    pub fn with_distance_cache_room_limit(distance_cache_room_limit: usize) -> Self {
        Self {
            exit_by_entry: HashMap::new(),
            rooms: HashMap::new(),
            nearest_endpoint_room_map_cache: RefCell::new(RoomMapLruCache::new(
                distance_cache_room_limit,
            )),
        }
    }

    pub fn from_packed_pairs_with_cache_limit(
        packed_pairs: &[u32],
        distance_cache_room_limit: usize,
    ) -> Self {
        let mut index = PortalIndex::with_distance_cache_room_limit(distance_cache_room_limit);
        for pair in packed_pairs.chunks_exact(2) {
            index.add_bidirectional(
                Position::from_packed(pair[0]),
                Position::from_packed(pair[1]),
            );
        }
        index
    }

    pub fn distance_cache_room_limit(&self) -> usize {
        self.nearest_endpoint_room_map_cache.borrow().limit()
    }

    pub fn debug_info(&self) -> PortalIndexDebugInfo {
        PortalIndexDebugInfo {
            cached_distance_maps: self.nearest_endpoint_room_map_cache.borrow().len(),
            max_cached_distance_maps: self.distance_cache_room_limit(),
            cached_portals: self.exit_by_entry.len(),
            portal_room_summaries: self.rooms.len(),
            total_size_bytes: self.approximate_memory_size_bytes(),
        }
    }

    pub fn set_distance_cache_room_limit(&mut self, limit: usize) {
        self.nearest_endpoint_room_map_cache
            .get_mut()
            .set_limit(limit);
    }

    #[cfg(test)]
    fn cached_endpoint_room_count(&self) -> usize {
        self.debug_info().cached_distance_maps
    }

    pub fn add_bidirectional(&mut self, a: Position, b: Position) {
        self.add_directed(a, b);
        self.add_directed(b, a);
        self.add_position(a);
        self.add_position(b);
        self.clear_distance_caches();
    }

    pub fn exit(&self, entry: Position) -> Option<Position> {
        self.exit_by_entry.get(&entry).copied()
    }

    pub fn is_empty(&self) -> bool {
        self.exit_by_entry.is_empty()
    }

    pub fn nearest_endpoint_range(&self, position: Position) -> usize {
        if self.rooms.is_empty() {
            return usize::MAX;
        }

        let mut best = usize::MAX;
        for radius in 0..=u8::MAX as i32 {
            self.for_each_room_at_range(position.room_name(), radius, |room| {
                if let Some(summary) = self.rooms.get(&room) {
                    for portal in &summary.portals {
                        best = best.min(position.get_range_to(*portal) as usize);
                    }
                }
            });

            if best == 0 {
                return best;
            }

            if radius == u8::MAX as i32 {
                break;
            }

            if self.min_possible_range_to_room_ring(position, radius + 1) >= best {
                return best;
            }
        }

        best
    }

    pub fn nearest_endpoint_room_map(&self, room: RoomName) -> Vec<usize> {
        let candidates = self.nearest_endpoint_candidates(room);
        let mut values = vec![usize::MAX; ROOM_AREA];
        for y in 0..ROOM_SIZE {
            for x in 0..ROOM_SIZE {
                let position = Position::new(
                    RoomCoordinate::new(x).unwrap(),
                    RoomCoordinate::new(y).unwrap(),
                    room,
                );
                values[(y as usize) * ROOM_SIZE as usize + x as usize] = candidates
                    .iter()
                    .map(|portal| position.get_range_to(*portal) as usize)
                    .min()
                    .unwrap_or(usize::MAX);
            }
        }
        values
    }

    pub fn nearest_endpoint_cached_range(&self, position: Position) -> usize {
        if self.rooms.is_empty() {
            return usize::MAX;
        }

        let room = position.room_name();
        let index = xy_to_linear_index(position.xy());
        if let Some(value) = self
            .nearest_endpoint_room_map_cache
            .borrow_mut()
            .get_value(room, index)
        {
            return value;
        }

        let values = self.nearest_endpoint_room_map(room);
        let result = values[index];
        self.nearest_endpoint_room_map_cache
            .borrow_mut()
            .insert(room, values);
        result
    }

    fn nearest_endpoint_candidates(&self, room: RoomName) -> Vec<Position> {
        if self.rooms.is_empty() {
            return Vec::new();
        }

        let mut candidates = Vec::new();
        for radius in 0..=u8::MAX as i32 {
            self.for_each_room_at_range(room, radius, |candidate_room| {
                if let Some(summary) = self.rooms.get(&candidate_room) {
                    candidates.extend(summary.portals.iter().copied());
                }
            });

            if radius == u8::MAX as i32 {
                break;
            }

            if !candidates.is_empty()
                && min_possible_range_between_room_and_ring(radius + 1)
                    > max_nearest_endpoint_range_in_room(room, &candidates)
            {
                return candidates;
            }
        }

        candidates
    }

    fn add_directed(&mut self, from: Position, to: Position) {
        self.exit_by_entry.insert(from, to);
    }

    fn clear_distance_caches(&mut self) {
        self.nearest_endpoint_room_map_cache.get_mut().clear();
    }

    fn add_position(&mut self, position: Position) {
        self.rooms
            .entry(position.room_name())
            .and_modify(|summary| {
                summary.add_position(position);
            })
            .or_insert_with(|| PortalRoomSummary::from_position(position));
    }

    fn for_each_room_at_range(&self, center: RoomName, radius: i32, mut f: impl FnMut(RoomName)) {
        if radius == 0 {
            f(center);
            return;
        }

        for dx in -radius..=radius {
            if let Some(room) = center.checked_add((dx, -radius)) {
                f(room);
            }
            if let Some(room) = center.checked_add((dx, radius)) {
                f(room);
            }
        }

        for dy in (-radius + 1)..=(radius - 1) {
            if let Some(room) = center.checked_add((-radius, dy)) {
                f(room);
            }
            if let Some(room) = center.checked_add((radius, dy)) {
                f(room);
            }
        }
    }

    fn min_possible_range_to_room_ring(&self, position: Position, radius: i32) -> usize {
        let mut best = usize::MAX;
        self.for_each_room_at_range(position.room_name(), radius, |room| {
            best = best.min(min_possible_range_to_room(position, room));
        });
        best
    }

    fn approximate_memory_size_bytes(&self) -> usize {
        size_of::<Self>()
            + self.exit_by_entry.capacity() * size_of::<(Position, Position)>()
            + self.rooms.capacity() * size_of::<(RoomName, PortalRoomSummary)>()
            + self
                .rooms
                .values()
                .map(|summary| summary.approximate_memory_size_bytes())
                .sum::<usize>()
            + self
                .nearest_endpoint_room_map_cache
                .borrow()
                .approximate_memory_size_bytes()
    }
}

impl RoomMapLruCache {
    fn new(limit: usize) -> Self {
        Self {
            limit,
            entries: HashMap::new(),
            recency: VecDeque::new(),
        }
    }

    fn limit(&self) -> usize {
        self.limit
    }

    fn len(&self) -> usize {
        self.entries.len()
    }

    fn clear(&mut self) {
        self.entries.clear();
        self.recency.clear();
    }

    fn set_limit(&mut self, limit: usize) {
        self.limit = limit;
        self.enforce_limit();
    }

    fn get_value(&mut self, room: RoomName, index: usize) -> Option<usize> {
        let value = self.entries.get(&room).map(|values| values[index]);
        if value.is_some() {
            self.touch(room);
        }
        value
    }

    fn insert(&mut self, room: RoomName, values: Vec<usize>) {
        if self.limit == 0 {
            return;
        }

        self.entries.insert(room, values);
        self.touch(room);
        self.enforce_limit();
    }

    fn touch(&mut self, room: RoomName) {
        self.recency.retain(|cached_room| *cached_room != room);
        self.recency.push_back(room);
    }

    fn enforce_limit(&mut self) {
        if self.limit == 0 {
            self.clear();
            return;
        }

        while self.entries.len() > self.limit {
            let Some(room) = self.recency.pop_front() else {
                break;
            };
            self.entries.remove(&room);
        }
    }

    fn approximate_memory_size_bytes(&self) -> usize {
        size_of::<Self>()
            + self.entries.capacity() * size_of::<(RoomName, Vec<usize>)>()
            + self
                .entries
                .values()
                .map(|values| values.capacity() * size_of::<usize>())
                .sum::<usize>()
            + self.recency.capacity() * size_of::<RoomName>()
    }
}

impl PortalRoomSummary {
    fn from_position(position: Position) -> Self {
        Self {
            portals: vec![position],
        }
    }

    fn add_position(&mut self, position: Position) {
        if self.portals.contains(&position) {
            return;
        }

        self.portals.push(position);
    }

    fn approximate_memory_size_bytes(&self) -> usize {
        size_of::<Self>() + self.portals.capacity() * size_of::<Position>()
    }
}

pub struct PortalIndexDebugInfo {
    cached_distance_maps: usize,
    max_cached_distance_maps: usize,
    cached_portals: usize,
    portal_room_summaries: usize,
    total_size_bytes: usize,
}

impl From<PortalIndexDebugInfo> for JsValue {
    fn from(info: PortalIndexDebugInfo) -> Self {
        let object = js_sys::Object::new();
        js_sys::Reflect::set(
            &object,
            &JsValue::from_str("cachedDistanceMaps"),
            &JsValue::from_f64(info.cached_distance_maps as f64),
        )
        .expect("setting cachedDistanceMaps should not fail");
        js_sys::Reflect::set(
            &object,
            &JsValue::from_str("maxCachedDistanceMaps"),
            &JsValue::from_f64(info.max_cached_distance_maps as f64),
        )
        .expect("setting maxCachedDistanceMaps should not fail");
        js_sys::Reflect::set(
            &object,
            &JsValue::from_str("cachedPortals"),
            &JsValue::from_f64(info.cached_portals as f64),
        )
        .expect("setting cachedPortals should not fail");
        js_sys::Reflect::set(
            &object,
            &JsValue::from_str("portalRoomSummaries"),
            &JsValue::from_f64(info.portal_room_summaries as f64),
        )
        .expect("setting portalRoomSummaries should not fail");
        js_sys::Reflect::set(
            &object,
            &JsValue::from_str("totalSizeBytes"),
            &JsValue::from_f64(info.total_size_bytes as f64),
        )
        .expect("setting totalSizeBytes should not fail");
        object.into()
    }
}

pub fn with_configured_portal_index<R>(f: impl FnOnce(&PortalIndex) -> R) -> R {
    CONFIGURED_PORTALS.with(|portals| f(&portals.borrow()))
}

#[wasm_bindgen]
pub fn set_portals(packed_pairs: Vec<u32>) {
    if !packed_pairs.len().is_multiple_of(2) {
        wasm_bindgen::throw_str("Portal list must contain packed position pairs");
    }

    CONFIGURED_PORTALS.with(|portals| {
        let mut portals = portals.borrow_mut();
        let distance_cache_room_limit = portals.distance_cache_room_limit();
        *portals = PortalIndex::from_packed_pairs_with_cache_limit(
            &packed_pairs,
            distance_cache_room_limit,
        );
    });
}

#[wasm_bindgen]
pub fn set_portal_distance_cache_room_limit(room_limit: usize) {
    CONFIGURED_PORTALS.with(|portals| {
        portals
            .borrow_mut()
            .set_distance_cache_room_limit(room_limit);
    });
}

#[wasm_bindgen]
pub fn clear_portals() {
    CONFIGURED_PORTALS.with(|portals| {
        let mut portals = portals.borrow_mut();
        let distance_cache_room_limit = portals.distance_cache_room_limit();
        *portals = PortalIndex::with_distance_cache_room_limit(distance_cache_room_limit);
    });
}

#[wasm_bindgen]
pub fn debug_portal_index() -> JsValue {
    with_configured_portal_index(|portals| portals.debug_info().into())
}

fn min_possible_range_to_room(position: Position, room: RoomName) -> usize {
    let min_x = room.x_coord() * ROOM_SIZE as i32;
    let min_y = room.y_coord() * ROOM_SIZE as i32;
    let max_x = min_x + ROOM_SIZE as i32 - 1;
    let max_y = min_y + ROOM_SIZE as i32 - 1;

    min_possible_range_to_rect(position, min_x, min_y, max_x, max_y)
}

fn min_possible_range_to_rect(
    position: Position,
    min_x: i32,
    min_y: i32,
    max_x: i32,
    max_y: i32,
) -> usize {
    let px = global_x(position);
    let py = global_y(position);

    let dx = if px < min_x {
        min_x - px
    } else if px > max_x {
        px - max_x
    } else {
        0
    };

    let dy = if py < min_y {
        min_y - py
    } else if py > max_y {
        py - max_y
    } else {
        0
    };

    dx.max(dy) as usize
}

fn max_nearest_endpoint_range_in_room(room: RoomName, candidates: &[Position]) -> usize {
    let mut max_range = 0;
    for y in 0..ROOM_SIZE {
        for x in 0..ROOM_SIZE {
            let position = Position::new(
                RoomCoordinate::new(x).unwrap(),
                RoomCoordinate::new(y).unwrap(),
                room,
            );
            let nearest = candidates
                .iter()
                .map(|portal| position.get_range_to(*portal) as usize)
                .min()
                .unwrap_or(usize::MAX);
            max_range = max_range.max(nearest);
        }
    }
    max_range
}

fn min_possible_range_between_room_and_ring(radius: i32) -> usize {
    if radius <= 0 {
        return 0;
    }

    let room_span = ROOM_SIZE as usize;
    ((radius as usize - 1) * room_span) + 1
}

fn global_x(position: Position) -> i32 {
    position.room_name().x_coord() * ROOM_SIZE as i32 + position.x().u8() as i32
}

fn global_y(position: Position) -> i32 {
    position.room_name().y_coord() * ROOM_SIZE as i32 + position.y().u8() as i32
}

#[cfg(test)]
mod tests {
    use super::*;
    use screeps::{RoomCoordinate, RoomName};

    fn room(name: &str) -> RoomName {
        name.parse().unwrap()
    }

    fn pos(room_name: &str, x: u8, y: u8) -> Position {
        Position::new(
            RoomCoordinate::new(x).unwrap(),
            RoomCoordinate::new(y).unwrap(),
            room(room_name),
        )
    }

    #[test]
    fn normalizes_portal_pairs_bidirectionally() {
        let a = pos("W1N1", 10, 20);
        let b = pos("W2N2", 30, 40);
        let index = PortalIndex::from_packed_pairs_with_cache_limit(
            &[a.packed_repr(), b.packed_repr()],
            DEFAULT_DISTANCE_CACHE_ROOM_LIMIT,
        );

        assert_eq!(index.exit(a), Some(b));
        assert_eq!(index.exit(b), Some(a));
    }

    #[test]
    fn nearest_endpoint_does_not_stop_at_current_room_if_adjacent_room_is_closer() {
        let mut index = PortalIndex::default();
        index.add_bidirectional(pos("W1N1", 0, 1), pos("W2N1", 0, 1));
        index.add_bidirectional(pos("W0N1", 0, 1), pos("E0N1", 0, 1));

        assert_eq!(index.nearest_endpoint_range(pos("W1N1", 49, 1)), 1);
    }

    #[test]
    fn nearest_endpoint_room_map_uses_adjacent_room_candidates() {
        let mut index = PortalIndex::default();
        index.add_bidirectional(pos("W1N1", 0, 1), pos("W2N1", 0, 1));
        index.add_bidirectional(pos("W0N1", 0, 1), pos("E0N1", 0, 1));

        let values = index.nearest_endpoint_room_map(room("W1N1"));

        assert_eq!(values[ROOM_SIZE as usize], 0);
        assert_eq!(values[ROOM_SIZE as usize + ROOM_SIZE as usize - 1], 1);
    }

    #[test]
    fn cached_endpoint_maps_are_invalidated_when_portals_change() {
        let mut index = PortalIndex::default();
        index.add_bidirectional(pos("W1N1", 10, 10), pos("W3N1", 20, 20));

        assert_eq!(index.nearest_endpoint_cached_range(pos("W1N1", 1, 1)), 9);

        index.add_bidirectional(pos("W1N1", 1, 1), pos("W4N1", 1, 1));

        assert_eq!(index.nearest_endpoint_cached_range(pos("W1N1", 1, 1)), 0);
    }

    #[test]
    fn cached_endpoint_maps_respect_room_limit() {
        let mut index = PortalIndex::with_distance_cache_room_limit(1);
        index.add_bidirectional(pos("W1N1", 10, 10), pos("W3N1", 20, 20));

        index.nearest_endpoint_cached_range(pos("W1N1", 1, 1));
        index.nearest_endpoint_cached_range(pos("W2N1", 1, 1));

        assert_eq!(index.cached_endpoint_room_count(), 1);
    }

    #[test]
    fn zero_room_cache_limit_disables_endpoint_map_caching() {
        let mut index = PortalIndex::with_distance_cache_room_limit(0);
        index.add_bidirectional(pos("W1N1", 10, 10), pos("W3N1", 20, 20));

        index.nearest_endpoint_cached_range(pos("W1N1", 1, 1));

        assert_eq!(index.cached_endpoint_room_count(), 0);
    }
}
