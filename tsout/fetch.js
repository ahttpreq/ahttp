import { guard } from 'libsugar/fn';
import { defineAHttpImpl } from './impl';
import { appendQueryString, buildFormData, buildQueryString } from './utils';
export * from './types';
export * from './utils';
export * from './impl';
/** 基于 fetch 的异步 http 构建器 */
export const AHttp = defineAHttpImpl(defaultConfig => {
    return async (config) => {
        if (defaultConfig != null) {
            config = new Proxy(config, {
                getPrototypeOf() {
                    return defaultConfig;
                },
            });
        }
        const url = new URL(config.url, config.base);
        let reqType = config.reqType;
        if (reqType == null && (config.data instanceof FormData || config.data instanceof Blob))
            reqType = 'raw';
        const req = guard({
            config,
            url,
            method: config.method ?? 'post',
            reqType: reqType ?? 'json',
            data: config.data,
            query: config.query,
            headers: config.headers,
            timeout: config.timeout,
        });
        const flow = [...(defaultConfig?.flow ?? []), ...(config.flow ?? []), send];
        const next = (i) => (req) => flow[i](req, next(i + 1));
        async function send(req) {
            let body = req.data;
            const reqType = req.reqType;
            if (body != null) {
                do {
                    if (typeof body === 'object' &&
                        (body instanceof FormData ||
                            body instanceof Blob ||
                            body instanceof ArrayBuffer ||
                            ArrayBuffer.isView(body) ||
                            body instanceof ReadableStream ||
                            body instanceof URLSearchParams)) {
                        break;
                    }
                    else {
                        switch (reqType) {
                            case 'json':
                                body = JSON.stringify(body);
                                break;
                            case 'query':
                                if (typeof body === 'object') {
                                    body = buildQueryString(body);
                                }
                                break;
                            case 'form':
                                if (typeof body === 'object') {
                                    body = buildFormData(body);
                                }
                                else {
                                    body = new FormData();
                                }
                        }
                    }
                } while (false);
            }
            if (req.query != null) {
                appendQueryString(req.url.searchParams, req.query);
            }
            const res = await fetch(req.url.href, {
                method: req.method,
                body: body,
                headers: req.headers,
                mode: 'cors',
                credentials: 'include',
            });
            throw 'todo';
        }
        return await flow[0](req, next(1));
    };
});
/** 异步 http 请求 */
export const ahttp = AHttp.ahttp;
/** 异步 get 请求 */
export const aget = ahttp.get;
/** 异步 post 请求 */
export const apost = ahttp.post;
/** 异步 put 请求 */
export const aput = ahttp.put;
/** 异步 delete 请求 */
export const adel = ahttp.del;
/** 异步 patch 请求 */
export const apatch = ahttp.patch;
//# sourceMappingURL=fetch.js.map