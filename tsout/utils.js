import { used } from 'libsugar/effect';
import { pipe } from 'libsugar/pipe';
import { filter, join, map } from 'libsugar/seq/fp';
/** 构建表单数据对象 */
export function buildFormData(params) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(params)) {
        switch (typeof v) {
            case 'bigint':
            case 'boolean':
            case 'number':
                fd.append(k, `${v}`);
                break;
            case 'string':
                fd.append(k, v);
                break;
            case 'undefined':
                break;
            case 'object':
                if (v == null)
                    break;
                else if (v instanceof Date)
                    fd.append(k, v.toString());
                else if (v instanceof File)
                    fd.append(k, v, v.name);
                else if (v instanceof Blob)
                    fd.append(k, v);
                else
                    fd.append(k, JSON.stringify(v));
        }
    }
    return fd;
}
/** 构建查询字符串迭代器 */
export const buildQueryStringIter = pipe((params) => Object.entries(params), map(([k, v]) => [
    k,
    used(v, v => {
        switch (typeof v) {
            case 'bigint':
            case 'boolean':
            case 'number':
                return `${v}`;
            case 'string':
                return v;
            case 'undefined':
                return '';
            case 'object':
                if (v == null)
                    return '';
                else if (v instanceof Date)
                    return v.toJSON();
                else
                    return JSON.stringify(v);
            default:
                return '';
        }
    }),
]), filter(([k, v]) => k != null && k != '' && v != null));
/** 构建查询字符串, 不包含 ? */
export const buildQueryString = pipe(buildQueryStringIter, map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`), join('&'));
/** 在现有的查询字符串上追加 */
export function appendQueryString(query, params) {
    for (const [k, v] of buildQueryStringIter(params)) {
        query.append(k, v);
    }
}
//# sourceMappingURL=utils.js.map