/** 异步 Http 请求错误基类 */
export class AHttpError extends Error {}

/** 读取 Body 时失败 */
export class AHttpReadBodyError extends AHttpError {
  constructor(public inner: any, public res: any, message?: string) {
    super(inner instanceof Error ? inner.message : (message && `读取 body 失败：${message}`) || '读取 body 失败')
  }
}

/** 解析 json 格式时失败 */
export class AHttpReadBodyJsonFormatError extends AHttpReadBodyError {
  constructor(inner: any, res: any) {
    super(inner, res, '解析 json 格式失败')
  }
}

/** 解析 blob 格式时失败 */
export class AHttpReadBodyBlobFormatError extends AHttpReadBodyError {
  constructor(inner: any, res: any) {
    super(inner, res, '解析 blob 格式失败')
  }
}

/** 解析 buffer 格式时失败 */
export class AHttpReadBodyBufferFormatError extends AHttpReadBodyError {
  constructor(inner: any, res: any) {
    super(inner, res, '解析 buffer 格式失败')
  }
}

/** 解析 form 格式时失败 */
export class AHttpReadBodyFormFormatError extends AHttpReadBodyError {
  constructor(inner: any, res: any) {
    super(inner, res, '解析 form 格式失败')
  }
}

/** 解析 text 格式时失败 */
export class AHttpReadBodyTextFormatError extends AHttpReadBodyError {
  constructor(inner: any, res: any) {
    super(inner, res, '解析 text 格式失败')
  }
}

/** 解析 query 格式时失败 */
export class AHttpReadBodyQueryFormatError extends AHttpReadBodyError {
  constructor(inner: any, res: any) {
    super(inner, res, '解析 query 格式失败')
  }
}
