import { expect } from "chai"
import { AhoCorasick } from "./ahocorasick"

function getAllMatches(input: string[], patterns: string[][]) {
    const aho = new AhoCorasick(patterns)
    return [...aho.search(input)]
}

describe("AhoCorasick", () => {
    describe("search() finds correct matches for", () => {
        it("[a] | [[a]]", () => {
            const matches = getAllMatches(["a"], [["a"]])
            expect(matches).length(1)
            expect(matches[0][0]).equal(0) // index
            expect(matches[0][1]).length(1) // outputs
            expect(matches[0][1][0]).length(1) // output tokens
            expect(matches[0][1][0][0]).equal("a")
        })

        it("[a] | [[b]]", () => {
            const matches = getAllMatches(["a"], [["b"]])
            expect(matches).length(0)
        })
        
        it("[a] | [[<empty>]]", () => {
            const matches = getAllMatches(["a"], [[""]])
            expect(matches).length(0)
        })

        it("[a] | [[]]", () => {
            const matches = getAllMatches(["a"], [[]])
            expect(matches).length(0)
        })

        it("[a] | []", () => {
            const matches = getAllMatches(["a"], [])
            expect(matches).length(0)
        })

        it("[] | [[a]]", () => {
            const matches = getAllMatches([], [["a"]])
            expect(matches).length(0)
        })

        it("[] | []", () => {
            const matches = getAllMatches([], [])
            expect(matches).length(0)
        })

        it("[<empty>] | [[a]]", () => {
            const matches = getAllMatches([""], [["a"]])
            expect(matches).length(0)
        })

        it("[a, b, c] | [[a]]", () => {
            const matches = getAllMatches(["a", "b", "c"], [["a"]])
            expect(matches).length(1)
            expect(matches[0][0]).equal(0) // index
            expect(matches[0][1]).length(1) // outputs
            expect(matches[0][1][0]).length(1) // output tokens
            expect(matches[0][1][0][0]).equal("a")
        })

        it("[a, b, c] | [[a, b]]", () => {
            const matches = getAllMatches(["a", "b", "c"], [["a", "b"]])
            expect(matches).length(1)
            expect(matches[0][0]).equal(1) // index
            expect(matches[0][1]).length(1) // outputs
            expect(matches[0][1][0]).length(2) // output tokens
            expect(matches[0][1][0][0]).equal("a")
            expect(matches[0][1][0][1]).equal("b")
        })
    })
})