// src/utils/apiOptimizer.js

/**
 * API Request Queue để batch và throttle requests
 */
class ApiRequestQueue {
  constructor() {
    this.queue = new Map();
    this.processing = false;
    this.batchSize = 10;
    this.batchDelay = 200;
  }

  /**
   * Thêm request vào queue
   * @param {string} key - Unique key cho request
   * @param {Function} requestFn - Function để thực hiện request
   * @returns {Promise} - Promise của request
   */
  async add(key, requestFn) {
    return new Promise((resolve, reject) => {
      if (!this.queue.has(key)) {
        this.queue.set(key, {
          requestFn,
          resolve,
          reject,
          timestamp: Date.now()
        });
      } else {
        // Nếu đã có request cùng key, resolve với promise hiện tại
        const existing = this.queue.get(key);
        existing.requestFn().then(resolve).catch(reject);
        return;
      }

      // Tự động process queue
      this.processQueue();
    });
  }

  /**
   * Process queue với batch và delay
   */
  async processQueue() {
    if (this.processing || this.queue.size === 0) return;

    this.processing = true;

    while (this.queue.size > 0) {
      const batch = [];
      const batchKeys = [];

      // Lấy batch requests
      for (const [key, item] of this.queue.entries()) {
        if (batch.length >= this.batchSize) break;
        batch.push(item);
        batchKeys.push(key);
      }

      // Xóa khỏi queue
      batchKeys.forEach(key => this.queue.delete(key));

      // Execute batch
      try {
        const results = await Promise.allSettled(
          batch.map(item => item.requestFn())
        );

        // Resolve/reject từng promise
        results.forEach((result, index) => {
          const item = batch[index];
          if (result.status === 'fulfilled') {
            item.resolve(result.value);
          } else {
            item.reject(result.reason);
          }
        });
      } catch (error) {
        // Nếu có lỗi, reject tất cả
        batch.forEach(item => item.reject(error));
      }

      // Delay giữa các batch
      if (this.queue.size > 0) {
        await new Promise(resolve => setTimeout(resolve, this.batchDelay));
      }
    }

    this.processing = false;
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue.clear();
    this.processing = false;
  }
}

// Global request queue instance
export const apiRequestQueue = new ApiRequestQueue();

/**
 * Throttle function để giới hạn số lần gọi trong một khoảng thời gian
 */
export function createThrottle(delay = 500) {
  let lastCall = 0;
  let timeoutId = null;

  return function throttle(fn, ...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      return fn(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Debounce function để delay execution cho đến khi không có call mới
 */
export function createDebounce(delay = 500) {
  let timeoutId = null;

  return function debounce(fn, ...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}


