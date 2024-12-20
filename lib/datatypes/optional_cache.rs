use std::collections::HashMap;
use std::hash::Hash;
use std::sync::{Arc, Mutex};

#[derive(Debug, Clone)]
pub struct OptionalCache<K, V, F>
where
    F: Fn(K) -> Option<V>,
{
    cache: Arc<Mutex<HashMap<K, Option<V>>>>,
    creator: F,
}

impl<K, V, F> OptionalCache<K, V, F>
where
    K: Hash + Eq + Clone,
    V: Clone,
    F: Fn(K) -> Option<V>,
{
    pub fn new(creator: F) -> Self {
        Self {
            cache: Arc::new(Mutex::new(HashMap::new())),
            creator,
        }
    }

    pub fn get_or_create(&self, key: K) -> Option<V> {
        self.cache
            .lock()
            .unwrap()
            .entry(key.clone())
            .or_insert_with(|| (self.creator)(key))
            .clone()
    }
}
