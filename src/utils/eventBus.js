/** Custom event bus so hooks/components can communicate without coupling. */
const listeners = {};

export const EventBus = {
  on(event, cb) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(cb);
    return () => this.off(event, cb);
  },
  off(event, cb) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter((f) => f !== cb);
  },
  emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach((cb) => cb(data));
  },
};
