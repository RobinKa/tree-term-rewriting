export function forEach<T>(iterable: IterableIterator<T>, fn: (t: T) => void) {
    for (const item of iterable) {
        fn(item)
    }
}

export function* map<TIn, TOut>(iterable: IterableIterator<TIn>, fn: (t: TIn) => TOut): IterableIterator<TOut> {
    for (const item of iterable) {
        yield fn(item)
    }
}

export function any<T>(iterable: IterableIterator<T>, fn: (t: T) => boolean): boolean {
    for (const item of iterable) {
        if (fn(item)) {
            return true
        }
    }

    return false
}

export function all<T>(iterable: IterableIterator<T>, fn: (t: T) => boolean): boolean {
    for (const item of iterable) {
        if (!fn(item)) {
            return false
        }
    }

    return true
}

export function* filter<T>(iterable: IterableIterator<T>, fn: (t: T) => boolean): IterableIterator<T> {
    for (const item of iterable) {
        if (fn(item)) {
            yield item
        }
    }
}

export function* flatten<T>(iterable: IterableIterator<IterableIterator<T>>): IterableIterator<T> {
    for (const item of iterable) {
        yield* item
    }
}

export function* flatMap<TIn, TOut>(iterable: IterableIterator<TIn>, fn: (t: TIn) => IterableIterator<TOut>): IterableIterator<TOut> {
    yield* flatten(map(iterable, fn))
}

export function first<T>(iterable: IterableIterator<T>): T | undefined {
    const t = iterable.next()
    if (!t.done) {
        return t.value
    }
    return undefined
}