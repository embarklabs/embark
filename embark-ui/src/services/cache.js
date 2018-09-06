export function put(key, value) {
  window.localStorage.setItem(key, value);
}

export function get(key) {
  return window.localStorage.getItem(key);
}

export function remove(key) {
  return window.localStorage.removeItem(key);
}

export function clear() {
  window.localStorage.clear();
}
