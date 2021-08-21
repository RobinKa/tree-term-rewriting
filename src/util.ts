export function sequenceEqual<T>(a: T[], b: T[]): boolean {
    return a.length === b.length && a.every((aItem, i) => aItem === b[i])
}

export function subsequenceEqual<T>(a: T[], sub: T[], startIndex: number): boolean {
    return sequenceEqual(a.slice(startIndex, startIndex + sub.length), sub)
}

export function* pairCombinations<T>(items: T[]) {
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            yield [items[i], items[j]]
        }
    }
}

export function* pairPermutations<T>(items: T[]) {
    for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < items.length; j++) {
            yield [items[i], items[j]]
        }
    }
}

export function* pairCombinationsWithReplacement<T>(items: T[]) {
    for (let i = 0; i < items.length; i++) {
        for (let j = i; j < items.length; j++) {
            yield [items[i], items[j]]
        }
    }
}
