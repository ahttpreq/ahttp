/** 定义异步 http 实现 */
export function defineAHttpImpl(def) {
    const build = ((defaultConfig) => {
        const ahttp = def(defaultConfig);
        ahttp.get = ((url, query, config) => ahttp({ ...config, url, query }));
        ahttp.post = ((url, data, config) => ahttp({ ...config, url, data }));
        ahttp.put = ((url, data, config) => ahttp({ ...config, url, data }));
        ahttp.del = ((url, data, config) => ahttp({ ...config, url, data }));
        ahttp.patch = ((url, data, config) => ahttp({ ...config, url, data }));
        return ahttp;
    });
    build.ahttp = build();
    return build;
}
//# sourceMappingURL=impl.js.map