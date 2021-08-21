import { expect } from "chai"
import { LexicographicPathOrdering } from "./lpo"
import { parseExpression } from "../parsing/parser"

describe("ordering", () => {
    const lpo = new LexicographicPathOrdering(["-", "!", "*", "^", "+"])

    describe("lpo", () => {
        it("a > a: false", () => {
            const a = parseExpression("a")
            expect(lpo.greaterThan(a, a)).false
        })

        it("a > b: false", () => {
            const a = parseExpression("a")
            const b = parseExpression("b")
            expect(lpo.greaterThan(a, b)).false
        })

        it("b > a: true", () => {
            const a = parseExpression("a")
            const b = parseExpression("b")
            expect(lpo.greaterThan(b, a)).true
        })

        it("a + c > a + b: false", () => {
            const aPlusC = parseExpression("a + c")
            const aPlusB = parseExpression("a + b")
            expect(lpo.greaterThan(aPlusC, aPlusB)).true
        })

        it("a + b > a * b: false", () => {
            const aPlusB = parseExpression("a + b")
            const aTimesB = parseExpression("a * b")
            expect(lpo.greaterThan(aPlusB, aTimesB)).false
        })

        it("(a + b) * c > a * c + b * c: true", () => {
            const lhs = parseExpression("(a + b) * c")
            const rhs = parseExpression("a * c + b * c")
            expect(lpo.greaterThan(lhs, rhs)).true
        })

        it("a * c + b * c > (a + b) * c: false", () => {
            const lhs = parseExpression("a * c + b * c")
            const rhs = parseExpression("(a + b) * c")
            expect(lpo.greaterThan(lhs, rhs)).false
        })

        it("(a + b) * d > (a + b) * c: false", () => {
            const lhs = parseExpression("(a + b) * d")
            const rhs = parseExpression("(a + b) * c")
            expect(lpo.greaterThan(lhs, rhs)).false
        })

        it("(a + b) * c > (a + b) * c: false", () => {
            const lhs = parseExpression("(a + b) * c")
            const rhs = parseExpression("(a + b) * c")
            expect(lpo.greaterThan(lhs, rhs)).false
        })

        it("0 ! scalar > 0 ! scalar * $x: false", () => {
            const lhs = parseExpression("0 ! scalar")
            const rhs = parseExpression("0 ! scalar * $x")
            expect(lpo.greaterThan(lhs, rhs)).false
        })

        it("0 ! scalar * $x > 0 ! scalar: false", () => {
            const lhs = parseExpression("0 ! scalar * $x")
            const rhs = parseExpression("0 ! scalar")
            expect(lpo.greaterThan(lhs, rhs)).false
        })

        it("($x + $y) ! $f > $x ! $f + $y ! $f: true", () => {
            const lhs = parseExpression("($x + $y) ! $f")
            const rhs = parseExpression("$x ! $f + $y ! $f")
            expect(lpo.greaterThan(lhs, rhs)).true
        })

        it("-$x + $x > 0: true", () => {
            const lhs = parseExpression("-$x + $x")
            const rhs = parseExpression("0")
            expect(lpo.greaterThan(lhs, rhs)).true
        })

        it("a + b > a: true", () => {
            const lhs = parseExpression("a + b")
            const rhs = parseExpression("a")
            expect(lpo.greaterThan(lhs, rhs)).true
        })

        it("a ! c * b ! c > a ! c ^ b ! c: true", () => {
            const lhs = parseExpression("a ! c * b ! c")
            const rhs = parseExpression("a ! c ^ b ! c")
            expect(lpo.greaterThan(lhs, rhs)).true
        })

        it("a ! c * b ! c > a ! c + b ! c: true", () => {
            const lhs = parseExpression("a ! c * b ! c")
            const rhs = parseExpression("a ! c + b ! c")
            expect(lpo.greaterThan(lhs, rhs)).true
        })
    })
})