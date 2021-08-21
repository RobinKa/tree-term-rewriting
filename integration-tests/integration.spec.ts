import { expect } from "chai"
import { KnuthBendixCompletion } from "../src/completion"
import { LexicographicPathOrdering } from "../src/ordering"
import { parseEulerRewriteRule, parseExpression } from "../src/parsing/parser"
import { makeEulerTree, treeFromEulerTree } from "../src/tree/tree"
import { sequenceEqual } from "../src/util"
import { applyRules, TermRewriteSystem } from "../src/trs"

describe("integration", () => {
    const lpo = new LexicographicPathOrdering(["~", "-", "!", "grade", "*", "^", "+", "="])
    const kb = new KnuthBendixCompletion(lpo)

    describe("applyRules()", () => {
        it("$x + $y = $y + $x, $x + 0 -> $x, (a + b) + 0 becomes a + b", () => {
            const trs = {
                rules: [
                    parseEulerRewriteRule("0 + $x -> $x"),
                ],
                equations: [
                    {
                        lhs: makeEulerTree(parseExpression("$x + $y")),
                        rhs: makeEulerTree(parseExpression("$y + $x"))
                    }
                ]
            }

            const applied = applyRules(makeEulerTree(parseExpression("(a + b) + 0")), trs, lpo)

            expect(applied.valueChain).length(5)
            expect(applied.valueChain[0]).equal("+")
            expect(applied.valueChain[1]).equal("a")
            expect(applied.valueChain[2]).equal("+")
            expect(applied.valueChain[3]).equal("b")
            expect(applied.valueChain[4]).equal("+")
        })
    })

    describe("applyRules() with knuthBendix()", () => {
        it("$x + $y = $y + $x, $x + 0 -> $x, 0 + a + 0 becomes a", () => {
            const trs = kb.complete({
                rules: [
                    parseEulerRewriteRule("$x + 0 -> $x"),
                ],
                equations: [
                    {
                        lhs: makeEulerTree(parseExpression("$x + $y")),
                        rhs: makeEulerTree(parseExpression("$y + $x"))
                    }
                ]
            })

            const applied = applyRules(makeEulerTree(parseExpression("0 + a + 0")), trs, lpo)

            expect(applied.valueChain).length(1)
            expect(applied.valueChain[0]).equal("a")
        })
    })

    describe("composeRules()", () => {
        describe("composes", () => {
            it("$x + $y -> $x * $y, $x * $y -> $x ! $y", () => {
                const trs = {
                    rules: [
                        parseEulerRewriteRule("$x + $y -> $x * $y"),
                        parseEulerRewriteRule("$x * $y -> $x ! $y"),
                    ],
                    equations: []
                }

                const changes = [...kb.composeRules(trs)]
                expect(changes).length(1)
                expect(changes[0].addEquation).equal(undefined)
                expect(changes[0].removeEquation).equal(undefined)
                expect(changes[0].removeRule).equal(trs.rules[0])
                expect(changes[0].addRule).not.equal(undefined)

                if (changes[0].addRule) {
                    expect(sequenceEqual(changes[0].addRule.from.valueChain, trs.rules[0].from.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].addRule.to.valueChain, trs.rules[1].to.valueChain)).equal(true)
                }
            })
        })
    })

    describe("deleteTrivialEquations()", () => {
        describe("deletes", () => {
            it("$x + $y = $x + $y", () => {
                const trs: TermRewriteSystem = {
                    rules: [],
                    equations: [
                        {
                            lhs: makeEulerTree(parseExpression("$x + $y")),
                            rhs: makeEulerTree(parseExpression("$x + $y"))
                        }
                    ]
                }
                const changes = [...kb.deleteTrivialEquations(trs)]

                expect(changes).length(1)
                expect(changes[0].addEquation).equal(undefined)
                expect(changes[0].removeEquation).not.equal(undefined)
                expect(changes[0].removeRule).equal(undefined)
                expect(changes[0].addRule).equal(undefined)

                if (changes[0].removeEquation) {
                    expect(sequenceEqual(changes[0].removeEquation.lhs.valueChain, trs.equations[0].lhs.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].removeEquation.rhs.valueChain, trs.equations[0].rhs.valueChain)).equal(true)
                }
            })
        })
    })

    describe("orientEquations()", () => {
        describe("orients", () => {
            it("$x + $y + $z -> $x + $y", () => {
                const trs: TermRewriteSystem = {
                    rules: [],
                    equations: [
                        {
                            lhs: makeEulerTree(parseExpression("$x + $y + $z")),
                            rhs: makeEulerTree(parseExpression("$x + $y"))
                        }
                    ]
                }
                const changes = [...kb.orientEquations(trs)]

                expect(changes).length(1)
                expect(changes[0].addEquation).equal(undefined)
                expect(changes[0].removeEquation).not.equal(undefined)
                expect(changes[0].removeRule).equal(undefined)
                expect(changes[0].addRule).not.equal(undefined)

                if (changes[0].removeEquation) {
                    expect(sequenceEqual(changes[0].removeEquation.lhs.valueChain, trs.equations[0].lhs.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].removeEquation.rhs.valueChain, trs.equations[0].rhs.valueChain)).equal(true)
                }

                if (changes[0].addRule) {
                    expect(sequenceEqual(changes[0].addRule.from.valueChain, trs.equations[0].lhs.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].addRule.to.valueChain, trs.equations[0].rhs.valueChain)).equal(true)
                }
            })
        })
    })

    describe("simplifyEquations()", () => {
        describe("simplifies", () => {
            it("$x + $y * $z = $x, $x + $y * $z -> $x ! $y", () => {
                const trs: TermRewriteSystem = {
                    rules: [
                        parseEulerRewriteRule("$x + $y * $z -> $x ! $y"),
                    ],
                    equations: [
                        {
                            lhs: makeEulerTree(parseExpression("$x + $y * $z")),
                            rhs: makeEulerTree(parseExpression("$x"))
                        }
                    ]
                }
                const changes = [...kb.simplifyEquations(trs)]

                expect(changes).length(1)
                expect(changes[0].addEquation).not.equal(undefined)
                expect(changes[0].removeEquation).not.equal(undefined)
                expect(changes[0].removeRule).equal(undefined)
                expect(changes[0].addRule).equal(undefined)

                if (changes[0].removeEquation) {
                    expect(sequenceEqual(changes[0].removeEquation.lhs.valueChain, trs.equations[0].lhs.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].removeEquation.rhs.valueChain, trs.equations[0].rhs.valueChain)).equal(true)
                }

                if (changes[0].addEquation) {
                    expect(sequenceEqual(changes[0].addEquation.lhs.valueChain, trs.rules[0].to.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].addEquation.rhs.valueChain, trs.equations[0].rhs.valueChain)).equal(true)
                }
            })
        })
    })

    describe("collapseRules()", () => {
        describe("collapses", () => {
            it("$x + $y * $z = $x, $x + $y * $z -> $x ! $y", () => {
                const trs: TermRewriteSystem = {
                    rules: [
                        parseEulerRewriteRule("$x + $y + $z -> $x"),
                        parseEulerRewriteRule("$x + $y -> $x"),
                    ],
                    equations: []
                }
                const changes = [...kb.collapseRules(trs)]

                expect(changes).length(1)
                expect(changes[0].addEquation).not.equal(undefined)
                expect(changes[0].removeEquation).equal(undefined)
                expect(changes[0].removeRule).not.equal(undefined)
                expect(changes[0].addRule).equal(undefined)

                if (changes[0].removeRule) {
                    expect(sequenceEqual(changes[0].removeRule.from.valueChain, trs.rules[0].from.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].removeRule.to.valueChain, trs.rules[0].to.valueChain)).equal(true)
                }

                if (changes[0].addEquation) {
                    expect(sequenceEqual(changes[0].addEquation.lhs.valueChain, makeEulerTree(parseExpression("$x + $y")).valueChain)).equal(true, `Expected ${makeEulerTree(parseExpression("$x + $y")).valueChain.join()} was ${changes[0].addEquation.lhs.valueChain.join()}`)
                    expect(sequenceEqual(changes[0].addEquation.rhs.valueChain, trs.rules[0].to.valueChain)).equal(true)
                }
            })

            it("-0 + $z -> $z, -0 -> 0", () => {
                const trs: TermRewriteSystem = {
                    rules: [
                        parseEulerRewriteRule("-0 + $z -> $z"),
                        parseEulerRewriteRule("-0 -> 0"),
                    ],
                    equations: []
                }
                const changes = [...kb.collapseRules(trs)]

                expect(changes).length(1)
                expect(changes[0].addEquation).not.equal(undefined)
                expect(changes[0].removeEquation).equal(undefined)
                expect(changes[0].removeRule).not.equal(undefined)
                expect(changes[0].addRule).equal(undefined)

                if (changes[0].removeRule) {
                    expect(sequenceEqual(changes[0].removeRule.from.valueChain, trs.rules[0].from.valueChain)).equal(true)
                    expect(sequenceEqual(changes[0].removeRule.to.valueChain, trs.rules[0].to.valueChain)).equal(true)
                }

                if (changes[0].addEquation) {
                    expect(sequenceEqual(changes[0].addEquation.lhs.valueChain, makeEulerTree(parseExpression("0 + $z")).valueChain)).equal(true, `Expected ${makeEulerTree(parseExpression("0 + $z")).valueChain.join()} was ${changes[0].addEquation.lhs.valueChain.join()}`)
                    expect(sequenceEqual(changes[0].addEquation.rhs.valueChain, trs.rules[0].to.valueChain)).equal(true)
                }
            })
        })
    })

    describe("normalizeEquations()", () => {
        describe("normalizes", () => {
            it("0 + $z = $z, 0 + $z -> $z", () => {
                const trs: TermRewriteSystem = {
                    rules: [
                        parseEulerRewriteRule("0 + $y -> $y"),
                    ],
                    equations: [
                        { lhs: makeEulerTree(parseExpression("0 + $z")), rhs: makeEulerTree(parseExpression("$z")) }
                    ]
                }
                const changes = [...kb.normalizeEquations(trs)]

                expect(changes).length(1)
                expect(changes[0].addEquation).not.equal(undefined)
                expect(changes[0].removeEquation).not.equal(undefined)
                expect(changes[0].removeRule).equal(undefined)
                expect(changes[0].addRule).equal(undefined)

                if (changes[0].removeEquation) {
                    expect(changes[0].removeEquation).equal(trs.equations[0])
                }

                if (changes[0].addEquation) {
                    expect(sequenceEqual(changes[0].addEquation.lhs.valueChain, makeEulerTree(parseExpression("$z")).valueChain)).equal(true, `Expected ${makeEulerTree(parseExpression("$z")).valueChain.join()} was ${changes[0].addEquation.lhs.valueChain.join()}`)
                    expect(sequenceEqual(changes[0].addEquation.rhs.valueChain, trs.equations[0].rhs.valueChain)).equal(true)
                }
            })
        })
    })

    describe("normalizeRules()", () => {
        describe("normalizes", () => {
            it("$x + $y + 0 -> $x + $y, $x + $y -> $x", () => {
                const trs: TermRewriteSystem = {
                    rules: [
                        parseEulerRewriteRule("$x + $y + 0 -> $x + $y"),
                        parseEulerRewriteRule("$x + $y -> $x"),
                    ],
                    equations: []
                }
                const changes = [...kb.normalizeRules(trs)]

                expect(changes).length(1)
                expect(changes[0].addEquation).equal(undefined)
                expect(changes[0].removeEquation).equal(undefined)
                expect(changes[0].removeRule).not.equal(undefined)
                expect(changes[0].addRule).not.equal(undefined)

                if (changes[0].removeRule) {
                    expect(changes[0].removeRule).equal(trs.rules[0])
                }

                if (changes[0].addRule) {
                    expect(sequenceEqual(changes[0].addRule.from.valueChain, makeEulerTree(parseExpression("$x + $y + 0")).valueChain)).equal(true, `Expected ${makeEulerTree(parseExpression("$x + $y + 0")).valueChain.join()} was ${changes[0].addRule.from.valueChain.join()}`)
                    expect(sequenceEqual(changes[0].addRule.to.valueChain, trs.rules[1].to.valueChain)).equal(true)
                }
            })
        })
    })
})
