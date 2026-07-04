// 测试辅助：mock 浏览器环境
export function setupBrowserMocks() {
    // mock localStorage
    const store = new Map();
    global.localStorage = {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, String(value));
        },
        removeItem(key) {
            store.delete(key);
        },
        clear() {
            store.clear();
        }
    };

    // mock console
    global.console = {
        log: () => {},
        error: () => {},
        warn: () => {},
        info: () => {}
    };
}

export function resetBrowserMocks() {
    global.localStorage.clear();
}
