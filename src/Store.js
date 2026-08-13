import EventEmitter from "./EventEmitter.js";

export default class Store {
  constructor(initialState) {
    this.state = structuredClone(initialState);
    /** @type EventEmitter */
    this.emitter = new EventEmitter();
  }

  get(key) {
    return this.state[key];
  }

  getState() {
    return structuredClone(this.state);
  }

  /**
   * @template {unknown} tValue
   * @param {string} key
   * @param {tValue} value
   */
  set(key, value) {
    this.state[key] = value;

    this.emitter.emit(key, value);
  }

  /**
   * @template {((...values: unknown[]) => unknown)} tCallback
   * @param {string} key
   * @param {tCallback} callback
   */
  subscribe(key, callback) {
    const success = this.emitter.on(key, callback);

    if (success && this.state[key] !== undefined) {
      callback(this.state[key]);
    }

    return success;
  }

  /**
   * @template {((...values: unknown[]) => unknown)} tCallback
   * @param {string} key
   * @param {tCallback} [callback]
   */
  unsubscribe(key, callback) {
    return this.emitter.off(key, callback);
  }
}