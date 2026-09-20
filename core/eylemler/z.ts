/**
 * NOTYA-EYLEM — zod-shaped validators for the action layer.
 *
 * The npm `zod` package is not in package.json and this build adds no dependency (the architecture
 * note asks for "no new vendor, no new cost"). This is the same validator the dermatoloji chapter
 * already ships (specialties/dermatoloji/z.ts), lifted into core/ so the shared spine never imports
 * a specialty. Call sites use the `z.object / z.enum / safeParse` API, so a one-line swap to
 * `import { z } from "zod"` stays possible. Body kept identical to the derm copy on purpose.
 */
export type ZodIssue = { path: Array<string | number>; message: string }
export type SafeParseSuccess<T> = { success: true; data: T }
export type SafeParseFailure = { success: false; error: { issues: ZodIssue[] } }
export type SafeParseReturn<T> = SafeParseSuccess<T> | SafeParseFailure

type ParseCtx = { path: Array<string | number>; issues: ZodIssue[] }

export abstract class ZodType<T> {
  readonly _type!: T
  abstract _parse(data: unknown, ctx: ParseCtx): T | undefined
  safeParse(data: unknown): SafeParseReturn<T> {
    const issues: ZodIssue[] = []
    const value = this._parse(data, { path: [], issues })
    if (issues.length) return { success: false, error: { issues } }
    return { success: true, data: value as T }
  }
  optional(): ZodOptional<T> {
    return new ZodOptional(this)
  }
  nullable(): ZodNullable<T> {
    return new ZodNullable(this)
  }
}

class ZodString extends ZodType<string> {
  constructor(private readonly minLen = 0) { super() }
  min(n: number) { return new ZodString(n) }
  _parse(data: unknown, ctx: ParseCtx) {
    if (typeof data !== 'string') {
      ctx.issues.push({ path: [...ctx.path], message: 'expected string' })
      return
    }
    if (data.length < this.minLen) {
      ctx.issues.push({ path: [...ctx.path], message: `string shorter than ${this.minLen}` })
      return
    }
    return data
  }
}

class ZodNumber extends ZodType<number> {
  constructor(
    private readonly opts: { int?: boolean; min?: number; max?: number } = {},
  ) { super() }
  int() { return new ZodNumber({ ...this.opts, int: true }) }
  min(n: number) { return new ZodNumber({ ...this.opts, min: n }) }
  max(n: number) { return new ZodNumber({ ...this.opts, max: n }) }
  _parse(data: unknown, ctx: ParseCtx) {
    if (typeof data !== 'number' || !Number.isFinite(data)) {
      ctx.issues.push({ path: [...ctx.path], message: 'expected number' })
      return
    }
    if (this.opts.int && !Number.isInteger(data)) {
      ctx.issues.push({ path: [...ctx.path], message: 'expected integer' })
      return
    }
    if (this.opts.min != null && data < this.opts.min) {
      ctx.issues.push({ path: [...ctx.path], message: `below min ${this.opts.min}` })
      return
    }
    if (this.opts.max != null && data > this.opts.max) {
      ctx.issues.push({ path: [...ctx.path], message: `above max ${this.opts.max}` })
      return
    }
    return data
  }
}

class ZodBoolean extends ZodType<boolean> {
  _parse(data: unknown, ctx: ParseCtx) {
    if (typeof data !== 'boolean') {
      ctx.issues.push({ path: [...ctx.path], message: 'expected boolean' })
      return
    }
    return data
  }
}

class ZodLiteral<V extends string | number | boolean> extends ZodType<V> {
  constructor(private readonly value: V) { super() }
  _parse(data: unknown, ctx: ParseCtx) {
    if (data !== this.value) {
      ctx.issues.push({ path: [...ctx.path], message: `expected literal ${String(this.value)}` })
      return
    }
    return this.value
  }
}

class ZodEnum<T extends string> extends ZodType<T> {
  constructor(private readonly values: readonly T[]) { super() }
  _parse(data: unknown, ctx: ParseCtx) {
    if (typeof data !== 'string' || !(this.values as readonly string[]).includes(data)) {
      ctx.issues.push({ path: [...ctx.path], message: `expected one of ${this.values.join('|')}` })
      return
    }
    return data as T
  }
}

class ZodArray<T> extends ZodType<T[]> {
  constructor(private readonly inner: ZodType<T>) { super() }
  _parse(data: unknown, ctx: ParseCtx) {
    if (!Array.isArray(data)) {
      ctx.issues.push({ path: [...ctx.path], message: 'expected array' })
      return
    }
    const out: T[] = []
    data.forEach((item, i) => {
      const v = this.inner._parse(item, { path: [...ctx.path, i], issues: ctx.issues })
      if (v !== undefined) out.push(v)
    })
    return out
  }
}

class ZodOptional<T> extends ZodType<T | undefined> {
  readonly _optional = true as const
  constructor(private readonly inner: ZodType<T>) { super() }
  _parse(data: unknown, ctx: ParseCtx) {
    if (data === undefined) return undefined
    return this.inner._parse(data, ctx)
  }
}

class ZodNullable<T> extends ZodType<T | null> {
  constructor(private readonly inner: ZodType<T>) { super() }
  _parse(data: unknown, ctx: ParseCtx) {
    if (data === null) return null
    return this.inner._parse(data, ctx)
  }
}

type Shape = Record<string, ZodType<unknown>>
type InferShape<S extends Shape> = {
  [K in keyof S as S[K] extends { _optional: true } ? never : K]: S[K]['_type']
} & {
  [K in keyof S as S[K] extends { _optional: true } ? K : never]?: S[K]['_type']
}

class ZodObject<S extends Shape> extends ZodType<InferShape<S>> {
  constructor(private readonly shape: S) { super() }
  _parse(data: unknown, ctx: ParseCtx) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      ctx.issues.push({ path: [...ctx.path], message: 'expected object' })
      return
    }
    const rec = data as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(this.shape)) {
      const parsed = this.shape[key]._parse(rec[key], { path: [...ctx.path, key], issues: ctx.issues })
      if (parsed !== undefined || rec[key] === undefined || rec[key] === null) {
        out[key] = parsed as unknown
      }
    }
    return out as InferShape<S>
  }
}

export const z = {
  string: () => new ZodString(),
  number: () => new ZodNumber(),
  boolean: () => new ZodBoolean(),
  literal: <V extends string | number | boolean>(v: V) => new ZodLiteral(v),
  enum: <T extends string>(values: readonly T[]) => new ZodEnum(values),
  array: <T>(inner: ZodType<T>) => new ZodArray(inner),
  object: <S extends Shape>(shape: S) => new ZodObject(shape),
}

export type Infer<T extends ZodType<unknown>> = T['_type']
