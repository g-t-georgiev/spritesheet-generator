export default class EventEmitter {
  /** @type {Map<string, Set<((...values: unknown[]) => unknown)>>} */
  events = new Map();

  /**
   * Register new event listener.
   *
   * Returns boolean value indicating whether operation was successful.
   * If listener already exists, will return `false`, otherwise, of course, `true`.
   *
   * @param {string} eventName
   * @param {((...values: unknown[]) => unknown)} callback
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    const callbacks = this.events.get(eventName);

    if (callbacks.has(callback)) return false;

    callbacks.add(callback);

    return true;
  }

  /**
   * Remove registered event listener.
   *
   * Returns a boolean value indicating whether the operation was successful.
   * If listener already exists, will return `true`, otherwise, of course, `true`.
   *
   * @param {string} eventName
   * @param {((...values: unknown[]) => unknown)} [callback]
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) return false;

    const callbacks = this.events.get(eventName);

    if (callback) return callbacks.delete(callback);

    callbacks.clear();

    return true;
  }

  /**
   * @param {string} eventName
   * @param {...unknown} params
   */
  emit(eventName, ...params) {
    if (!this.events.has(eventName)) return;

    this.events.get(eventName).forEach((cb) => cb(...params));
  }
}

export const GlobalEmitter = new EventEmitter();