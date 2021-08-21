import { EulerTree, eulerTreePatternMatch, eulerTreeSubstitute, depthFirst, makeEulerTree, treeFromEulerTree, TreeNode, equationUrl, ruleUrl, replaceVariables, postfixVariables, makePostfixesVariables } from "../tree"
import { pairPermutations, sequenceEqual } from "../util"
import { any, first, flatMap } from "../generatorutil"
import { Ordering } from "../ordering"
import { Completion } from "./completion"
import { applyChange, applyRules, getTrsRules, makeEquationVariablesCanonical, makeRuleVariablesCanonical, rewrite, TermRewriteSystem, TermRewriteSystemChange, trsEqual } from "../trs"


export type CriticalPair = [EulerTree, EulerTree]

/**
 * Whether a is an instance of b
 */
function termInstanceOf(a: EulerTree, b: EulerTree): boolean {
    const aWithoutVariables = replaceVariables(postfixVariables(a, "_"))
    const firstMatch = eulerTreePatternMatch(aWithoutVariables, b).next()
    return !firstMatch.done
}

export class KnuthBendixCompletion implements Completion {
    constructor(private readonly ordering: Ordering) {

    }

    complete(trs: TermRewriteSystem): TermRewriteSystem {
        return this.knuthBendix(trs)
    }

    knuthBendix(trs: TermRewriteSystem, maxIters?: number): TermRewriteSystem {
        let newTrs = {
            equations: trs.equations.map(makeEquationVariablesCanonical),
            rules: trs.rules.map(makeRuleVariablesCanonical)
        }

        this.validateRuleComplexities(newTrs)

        for (let i = 0; !maxIters || i < maxIters; i++) {
            console.log("---------", i)
            let newTrsBeforeLoop = {
                equations: [...newTrs.equations],
                rules: [...newTrs.rules]
            }

            const steps = [
                (trs: TermRewriteSystem) => this.simplifyEquations(trs),
                (trs: TermRewriteSystem) => this.normalizeEquations(trs),
                (trs: TermRewriteSystem) => this.deleteTrivialEquations(trs),
                (trs: TermRewriteSystem) => this.orientEquations(trs),
                (trs: TermRewriteSystem) => this.normalizeRules(trs),
                (trs: TermRewriteSystem) => this.composeRules(trs),
                (trs: TermRewriteSystem) => this.deduce(trs),
            ]

            for (const step of steps) {
                let result = first(step(newTrs))
                if (result) {
                    console.log("** has change")
                    newTrs = applyChange(newTrs, result)
                    this.validateRuleComplexities(newTrs)
                }
            }

            if (trsEqual(newTrs, newTrsBeforeLoop)) {
                console.log("Done after", i + 1, "loops")
                break
            } else {
                newTrsBeforeLoop = newTrs
            }
        }

        return newTrs
    }

    validateRuleComplexities(trs: TermRewriteSystem) {
        for (const rule of getTrsRules(trs)) {
            const complexityComparison = this.ordering.compare(treeFromEulerTree(rule.from), treeFromEulerTree(rule.to))

            if (!rule.fromEquation && complexityComparison <= 0) {
                if (complexityComparison === 0) {
                    throw Error(`Rule LHS complexity and RHS complexity not equal even though rule comes from an equation: ${JSON.stringify(rule)}`)
                } else {
                    throw Error(`Rule LHS complexity less than or equal to RHS complexity): ${JSON.stringify(rule)}`)
                }
            }
        }
    }

    /**
     * Whether any subterm of a is an instance of b
     */
    anySubTermInstanceOf(a: EulerTree, b: EulerTree) {
        return any(depthFirst(treeFromEulerTree(a)), subTreeRoot => {
            const eulerSubTree = makeEulerTree(subTreeRoot)
            return subTreeRoot.children.length !== 0 && termInstanceOf(eulerSubTree, b) && !termInstanceOf(b, eulerSubTree)
        })
    }

    *findCriticalPairs(trs: TermRewriteSystem): IterableIterator<{ criticalPair: CriticalPair, criticalTerm: EulerTree }> {
        // Iterate over all pairs of rules
        for (const [ruleA, ruleB] of pairPermutations(getTrsRules(trs))) {
            for (const [u, v] of [[ruleA.from, ruleB.from]]) {
                const euler = u
                // Ex: ($x + $y) + $z
                const root = treeFromEulerTree(euler)
                // Ex: x + 0
                const other = replaceVariables(postfixVariables(v, "_"))

                const ordering = this.ordering

                yield* flatMap(depthFirst(root), function* (subRoot: TreeNode) {
                    if (subRoot.children.length === 0) {
                        return
                    }

                    // Ex: $x + $y
                    const eulerSubRoot = makeEulerTree(subRoot)

                    for (const match of eulerTreePatternMatch(other, eulerSubRoot)) {
                        const matchVariables = Object.keys(match)
                        // Choose the first matches
                        // Ex: $x: x
                        //     $y: 0

                        // Subtitute matches into the whole tree
                        // Ex: 1. (x + y) + z | x->x = (x + y) + z
                        //     2. (x + y) + z | y->0 = (x + 0) + z
                        let substituted = postfixVariables(euler, "_")
                        for (const variable of matchVariables) {
                            const variableTree = makeEulerTree({
                                index: 0,
                                value: variable.replaceAll("$", "") + "_",
                                children: []
                            })

                            match[variable].valueChain = match[variable].valueChain.map(v => v.replaceAll("_", "__"))

                            substituted = eulerTreeSubstitute(substituted, variableTree, match[variable])
                        }

                        const lhs = applyRules(substituted, { rules: [{ from: ruleA.from, to: ruleA.to }], equations: [] }, ordering, 1)
                        if (ordering.compare(treeFromEulerTree(lhs), treeFromEulerTree(substituted)) > 0) {
                            continue
                        }

                        const rhs = applyRules(substituted, { rules: [{ from: ruleB.from, to: ruleB.to }], equations: [] }, ordering, 1)
                        if (ordering.compare(treeFromEulerTree(rhs), treeFromEulerTree(substituted)) > 0) {
                            continue
                        }

                        // Normalize the previous results
                        const normalizedLhs = applyRules(lhs, trs, ordering)
                        const normalizedRhs = applyRules(rhs, trs, ordering)

                        if (!sequenceEqual(normalizedLhs.valueChain, normalizedRhs.valueChain)) {
                            let nextVariableIndex = 0
                            const variableNameMap: Record<string, string> = {}
                            const variableNames = new Set<string>(normalizedLhs.valueChain.concat(normalizedRhs.valueChain).filter(x => x.endsWith("_")))
                            for (const variableName of variableNames) {
                                variableNameMap[variableName] = `$${nextVariableIndex++}`
                            }

                            const subVars = (eulerTree: EulerTree) => {
                                eulerTree.valueChain = eulerTree.valueChain.map(x => x in variableNameMap ? variableNameMap[x] : x)
                            }

                            subVars(normalizedLhs)
                            subVars(normalizedRhs)
                            subVars(substituted)

                            const criticalPair: CriticalPair = [
                                normalizedLhs,
                                normalizedRhs
                            ]

                            yield {
                                criticalPair,
                                criticalTerm: substituted
                            }
                        }
                    }
                })
            }
        }
    }

    *deduce(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        const criticalThings = this.findCriticalPairs(trs)
        for (const { criticalPair, criticalTerm } of criticalThings) {
            const pairTermComplexityComparison = criticalPair.map(c => this.ordering.compare(treeFromEulerTree(c), treeFromEulerTree(criticalTerm)))

            if (pairTermComplexityComparison[0] > 0 || pairTermComplexityComparison[1] > 0) {
                continue
            }

            // If both sides have equal complexity, return both rules, otherwise the less complex one.
            const pairPairComplexityComparison = this.ordering.compare(treeFromEulerTree(criticalPair[0]), treeFromEulerTree(criticalPair[1]))

            if (pairPairComplexityComparison === 0) {
                yield {
                    addEquation: { lhs: criticalPair[0], rhs: criticalPair[1] }
                }
            } else {
                yield {
                    addRule: pairPairComplexityComparison > 0 ?
                        { from: criticalPair[0], to: criticalPair[1] } :
                        { from: criticalPair[1], to: criticalPair[0] }
                }
            }
        }
    }

    *composeRules(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        for (const rule of trs.rules) {
            const trsWithoutRule = {
                rules: trs.rules.filter(r => rule !== r),
                equations: trs.equations
            }
            const normalizedRhs = makePostfixesVariables(applyRules(replaceVariables(postfixVariables(rule.to, "_")), trsWithoutRule, this.ordering), "_")
            if (!sequenceEqual(rule.to.valueChain, normalizedRhs.valueChain)) {
                yield {
                    removeRule: rule,
                    addRule: {
                        from: rule.from,
                        to: normalizedRhs
                    },
                }
            }
        }
    }

    *simplifyEquations(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        for (const equation of trs.equations) {
            const canonicalEquation = makeEquationVariablesCanonical(equation)
            for (const rule of getTrsRules(trs)) {
                const canonicalRule = makeRuleVariablesCanonical(rule)
                if (sequenceEqual(canonicalEquation.lhs.valueChain, canonicalRule.from.valueChain) && (!rule.fromEquation || this.anySubTermInstanceOf(canonicalEquation.lhs, canonicalRule.from))) {
                    // a = c, a -> b
                    // b = c, a -> b

                    yield {
                        removeEquation: equation,
                        addEquation: {
                            lhs: rule.to,
                            rhs: equation.rhs
                        }
                    }
                } else if (sequenceEqual(canonicalEquation.rhs.valueChain, canonicalRule.from.valueChain) && (!rule.fromEquation || this.anySubTermInstanceOf(canonicalEquation.rhs, canonicalRule.from))) {
                    // c = a, a -> b
                    // c = b, a -> b

                    yield {
                        removeEquation: equation,
                        addEquation: {
                            lhs: canonicalEquation.lhs,
                            rhs: canonicalRule.to
                        }
                    }
                }
            }
        }
    }

    *deleteTrivialEquations(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        for (const equation of trs.equations) {
            if (sequenceEqual(equation.lhs.valueChain, equation.rhs.valueChain)) {
                yield {
                    removeEquation: equation
                }
            }
        }
    }

    *orientEquations(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        for (const equation of trs.equations) {
            const complexityComparison = this.ordering.compare(treeFromEulerTree(equation.lhs), treeFromEulerTree(equation.rhs))
            if (complexityComparison !== 0) {
                yield {
                    removeEquation: equation,
                    addRule: complexityComparison > 0 ? {
                        from: equation.lhs,
                        to: equation.rhs
                    } : {
                        from: equation.rhs,
                        to: equation.lhs
                    }
                }
            }
        }
    }

    *collapseRules(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        for (const rule of trs.rules) {
            // IF we have a rule a->b and there's already a rule c->d
            // AND some subterm of a is an instance of b and no subterm of b is an instance of a,
            // THEN remove the former rule and add the equation b = c.
            // Example:
            // R1) a + b + c -> a
            // R2) a + b -> a
            // Remove R1, Add a + b = a (ie. LHS: R2 applied to LHS of R1, RHS unchanged)
            const trsWithoutRule = {
                equations: trs.equations,
                rules: trs.rules.filter(r => r !== rule)
            }

            const rewriteResults = rewrite(replaceVariables(postfixVariables(rule.from, "_")), trsWithoutRule, this.ordering)

            if (rewriteResults && this.anySubTermInstanceOf(rule.from, rewriteResults.rule.from)) {
                yield {
                    removeRule: rule,
                    addEquation: {
                        lhs: makePostfixesVariables(rewriteResults.rewritten, "_"),
                        rhs: rule.to
                    }
                }
                break
            }
        }
    }

    *normalizeEquations(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        for (const equation of trs.equations) {
            const trsWithoutEquation: TermRewriteSystem = {
                rules: trs.rules,
                equations: trs.equations.filter(eq => eq !== equation)
            }

            const rewriteResultsLhs = rewrite(replaceVariables(postfixVariables(equation.lhs, "_")), trsWithoutEquation, this.ordering)
            const rewriteResultsRhs = rewrite(replaceVariables(postfixVariables(equation.rhs, "_")), trsWithoutEquation, this.ordering)

            if (rewriteResultsLhs || rewriteResultsRhs) {
                const newLhs = rewriteResultsLhs?.rewritten ? makePostfixesVariables(rewriteResultsLhs?.rewritten, "_") : equation.lhs
                const newRhs = rewriteResultsRhs?.rewritten ? makePostfixesVariables(rewriteResultsRhs?.rewritten, "_") : equation.rhs
                yield {
                    removeEquation: equation,
                    addEquation: {
                        lhs: newLhs,
                        rhs: newRhs
                    }
                }
            }
        }
    }

    *normalizeRules(trs: TermRewriteSystem): IterableIterator<TermRewriteSystemChange> {
        for (const rule of trs.rules) {
            const rewriteResults = rewrite(replaceVariables(postfixVariables(rule.to, "_")), trs, this.ordering)

            if (rewriteResults) {
                const newTo = makePostfixesVariables(rewriteResults.rewritten, "_")

                yield {
                    removeRule: rule,
                    addRule: {
                        from: rule.from,
                        to: newTo
                    }
                }
            }
        }
    }
}
