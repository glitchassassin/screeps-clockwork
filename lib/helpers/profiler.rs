
use std::sync::atomic::{AtomicU32, Ordering};
use std::cell::UnsafeCell;
use screeps::game::{cpu, time};
use crate::log;
use lazy_static::lazy_static;

const MAX_PROFILED_FUNCTIONS: usize = 64;

lazy_static! {
    pub static ref PROFILER: Profiler = Profiler::new();
}

#[derive(Copy, Clone)]
struct ProfileEntry {
    name: &'static str,
    count: u32,
    total_time: f32,
    start_time: f32,
}

impl Default for ProfileEntry {
    fn default() -> Self {
        Self {
            name: "",
            count: 0,
            total_time: 0.0,
            start_time: 0.0,
        }
    }
}

pub struct Profiler {
    start_tick: AtomicU32,
    total_ticks: AtomicU32,
    entries: UnsafeCell<[ProfileEntry; MAX_PROFILED_FUNCTIONS]>,
    next_entry: AtomicU32,
}

// Safe to implement since we're in a single-threaded environment
unsafe impl Sync for Profiler {}

impl Profiler {
    pub fn new() -> Self {
        Self {
            start_tick: AtomicU32::new(time()),
            total_ticks: AtomicU32::new(1),
            entries: UnsafeCell::new([ProfileEntry::default(); MAX_PROFILED_FUNCTIONS]),
            next_entry: AtomicU32::new(0),
        }
    }

    #[inline(always)]
    fn find_slot(&self, name: &'static str) -> usize {
        // Safe in single-threaded environment
        let entries = unsafe { &*self.entries.get() };
        let next_entry = self.next_entry.load(Ordering::Relaxed) as usize;
        
        // Fast path - check existing entries
        for i in 0..next_entry {
            if entries[i].name == name {
                return i;
            }
        }
        
        // Create new entry if space available
        if next_entry < MAX_PROFILED_FUNCTIONS {
            self.next_entry.fetch_add(1, Ordering::Relaxed);
            return next_entry;
        }
        
        // Fallback to first slot if full
        0
    }

    #[inline(always)]
    pub fn start_call(&self, name: &'static str) {
        let current_tick = time();
        let prev_tick = self.start_tick.load(Ordering::Relaxed);
        if current_tick != prev_tick {
            self.start_tick.store(current_tick, Ordering::Relaxed);
            self.total_ticks.fetch_add(1, Ordering::Relaxed);
        }

        let slot = self.find_slot(name);
        // Safe in single-threaded environment
        let entries = unsafe { &mut *self.entries.get() };
        
        if entries[slot].count == 0 {
            entries[slot].name = name;
        }
        // get the current cpu time

        entries[slot].start_time = cpu::get_used() as f32;
        // entries[slot].start_time = self.start_time.elapsed().as_millis() as f32;
        
    }

    #[inline(always)]
    pub fn end_call(&self, name: &'static str) {
        let end_time = cpu::get_used() as f32;
        // let end_time = self.start_time.elapsed().as_millis() as f32;
        let slot = self.find_slot(name);
        
        // Safe in single-threaded environment
        let entries = unsafe { &mut *self.entries.get() };
        entries[slot].count += 1;
        entries[slot].total_time += end_time - entries[slot].start_time;
    }

    pub fn get_results(&self) -> Vec<(String, ProfileStats)> {
        let total_ticks = self.total_ticks.load(Ordering::Relaxed) as f32;
        let mut results = Vec::new();
        let next_entry = self.next_entry.load(Ordering::Relaxed) as usize;
        
        // Safe in single-threaded environment
        let entries = unsafe { &*self.entries.get() };
        
        for entry in &entries[..next_entry] {
            if entry.count > 0 {
                let count = entry.count as usize;
                let total_time = entry.total_time as f64;
                let avg_time = total_time / count as f64;
                let calls_per_tick = count as f64 / total_ticks as f64;
                let cpu_per_tick = total_time / total_ticks as f64;
                
                results.push((entry.name.to_string(), ProfileStats {
                    count,
                    total_time,
                    avg_time,
                    calls_per_tick,
                    cpu_per_tick,
                }));
            }
        }
        
        results
    }

    pub fn print_results(&self) {
        let mut stats: Vec<_> = self.get_results().into_iter().collect();
        stats.sort_by(|a, b| b.1.total_time.partial_cmp(&a.1.total_time).unwrap());

        // Calculate column widths
        let mut name_width = 9; // "Operation"
        let mut count_width = 5; // "Count"
        let mut total_width = 9; // "Total CPU"
        let mut avg_width = 8; // "Avg CPU"
        let mut cpu_tick_width = 8; // "CPU/tick"
        let mut calls_tick_width = 10; // "Calls/tick"

        for (name, stats) in &stats {
            name_width = name_width.max(name.len());
            count_width = count_width.max(format!("{}", stats.count).len());
            total_width = total_width.max(format!("{:.2}", stats.total_time).len());
            avg_width = avg_width.max(format!("{:.4}", stats.avg_time).len());
            cpu_tick_width = cpu_tick_width.max(format!("{:.4}", stats.cpu_per_tick).len());
            calls_tick_width = calls_tick_width.max(format!("{:.2}", stats.calls_per_tick).len());
        }

        let mut table = format!("\nProfiling Results (over {} ticks):\n", self.total_ticks.load(Ordering::Relaxed));
        
        // Header
        table.push_str(&format!(
            "| {:<width_name$} | {:>width_count$} | {:>width_total$} | {:>width_avg$} | {:>width_cpu$} | {:>width_calls$} |\n",
            "Operation", "Count", "Total CPU", "Avg CPU", "CPU/tick", "Calls/tick",
            width_name = name_width,
            width_count = count_width,
            width_total = total_width,
            width_avg = avg_width,
            width_cpu = cpu_tick_width,
            width_calls = calls_tick_width
        ));

        // Separator
        table.push_str(&format!(
            "|{:-<width_name$}-|{:-<width_count$}-|{:-<width_total$}-|{:-<width_avg$}-|{:-<width_cpu$}-|{:-<width_calls$}-|\n",
            "", "", "", "", "", "",
            width_name = name_width + 2,
            width_count = count_width + 2,
            width_total = total_width + 2,
            width_avg = avg_width + 2,
            width_cpu = cpu_tick_width + 2,
            width_calls = calls_tick_width + 2
        ));
        
        // Data rows
        for (name, stats) in stats {
            table.push_str(&format!(
                "| {:<width_name$} | {:>width_count$} | {:>width_total$.2} | {:>width_avg$.4} | {:>width_cpu$.4} | {:>width_calls$.2} |\n",
                name, stats.count, stats.total_time, stats.avg_time, stats.cpu_per_tick, stats.calls_per_tick,
                width_name = name_width,
                width_count = count_width,
                width_total = total_width,
                width_avg = avg_width,
                width_cpu = cpu_tick_width,
                width_calls = calls_tick_width
            ));
        }

        unsafe {
            log(&table);
        }
    }

    pub fn reset(&self) {
        // Safe in single-threaded environment
        let entries = unsafe { &mut *self.entries.get() };
        for entry in entries.iter_mut() {
            *entry = ProfileEntry::default();
        }
        self.next_entry.store(0, Ordering::Relaxed);
        self.start_tick.store(time(), Ordering::Relaxed);
        self.total_ticks.store(1, Ordering::Relaxed);
    }
}

#[derive(Debug)]
pub struct ProfileStats {
    pub count: usize,
    pub total_time: f64,
    pub avg_time: f64,
    pub calls_per_tick: f64,
    pub cpu_per_tick: f64,
}

