use std::cell::RefCell;
use std::collections::HashMap;
use std::hash::Hash;
use std::rc::Rc;

pub struct OptionalCache<'a, K, V> {
    cache: Rc<RefCell<HashMap<K, Option<V>>>>,
    creator: Box<dyn Fn(K) -> Option<V> + 'a>,
}

impl<'a, K, V> OptionalCache<'a, K, V>
where
    K: Hash + Eq + Clone,
    V: Clone,
{
    pub fn new(creator: impl Fn(K) -> Option<V> + 'a) -> Self {
        Self {
            cache: Rc::new(RefCell::new(HashMap::new())),
            creator: Box::new(creator),
        }
    }

    pub fn get_or_create(&self, key: K) -> Option<V> {
        self.cache
            .borrow_mut()
            .entry(key.clone())
            .or_insert_with(|| (self.creator)(key))
            .clone()
    }
}
