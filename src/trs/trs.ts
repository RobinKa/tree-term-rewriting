import { EulerTree, TreeNode } from "../tree/tree"
import { sequenceEqual } from "../util"

export type RewriteRule = { from: TreeNode, to: TreeNode }
export type EulerRewriteRule = { from: EulerTree, to: EulerTree, applicationMustSimplify?: boolean }

export type TRSEquation = {
    lhs: EulerTree
    rhs: EulerTree
}

export type TRSRule = {
    from: EulerTree
    to: EulerTree
    fromEquation?: TRSEquation
}

export type TermRewriteSystem = {
    equations: TRSEquation[]
    rules: TRSRule[]
}

export type TermRewriteSystemChange = {
    addRule?: TRSRule
    removeRule?: TRSRule
    addEquation?: TRSEquation
    removeEquation?: TRSEquation
}

export function trsEqual(trsA: TermRewriteSystem, trsB: TermRewriteSystem) {
    return trsA.equations.every(eqA => trsB.equations.some(eqB => equationsEqual(eqA, eqB))) &&
        trsA.rules.every(ruleA => trsB.rules.some(ruleB => rulesEqual(ruleA, ruleB)))
}

export function equationsEqual(eqA: TRSEquation, eqB: TRSEquation) {
    const canonicalA = makeEquationVariablesCanonical(eqA)
    const canonicalB = makeEquationVariablesCanonical(eqB)
    return sequenceEqual(canonicalA.lhs.valueChain, canonicalB.lhs.valueChain) && sequenceEqual(canonicalA.rhs.valueChain, canonicalB.rhs.valueChain)
}

export function rulesEqual(ruleA: TRSRule, ruleB: TRSRule) {
    const canonicalA = makeRuleVariablesCanonical(ruleA)
    const canonicalB = makeRuleVariablesCanonical(ruleB)
    return sequenceEqual(canonicalA.from.valueChain, canonicalB.from.valueChain) && sequenceEqual(canonicalA.to.valueChain, canonicalB.to.valueChain)
}

export function makeEquationVariablesCanonical(equation: TRSEquation): TRSEquation {
    const variableNameMap: Record<string, string> = {}
    const variableNames = new Set<string>(equation.lhs.valueChain.concat(equation.rhs.valueChain).filter(x => x.startsWith("$")))
    let nextVariableIndex = 0
    for (const variableName of variableNames) {
        variableNameMap[variableName] = `$${nextVariableIndex++}`
    }

    const subVars = (eulerTree: EulerTree) => {
        eulerTree.valueChain = eulerTree.valueChain.map(x => x in variableNameMap ? variableNameMap[x] : x)
    }

    const canonical = {
        lhs: {
            indexChain: [...equation.lhs.indexChain],
            valueChain: [...equation.lhs.valueChain],
        },
        rhs: {
            indexChain: [...equation.rhs.indexChain],
            valueChain: [...equation.rhs.valueChain],
        },
    }

    subVars(canonical.lhs)
    subVars(canonical.rhs)

    return canonical
}

export function makeRuleVariablesCanonical(rule: TRSRule): TRSRule {
    const variableNameMap: Record<string, string> = {}
    const variableNames = new Set<string>(rule.from.valueChain.concat(rule.to.valueChain).filter(x => x.startsWith("$")))
    let nextVariableIndex = 0
    for (const variableName of variableNames) {
        variableNameMap[variableName] = `$${nextVariableIndex++}`
    }

    const subVars = (eulerTree: EulerTree) => {
        eulerTree.valueChain = eulerTree.valueChain.map(x => x in variableNameMap ? variableNameMap[x] : x)
    }

    const canonical = {
        from: {
            indexChain: [...rule.from.indexChain],
            valueChain: [...rule.from.valueChain],
        },
        to: {
            indexChain: [...rule.to.indexChain],
            valueChain: [...rule.to.valueChain],
        },
    }

    subVars(canonical.from)
    subVars(canonical.to)

    return canonical
}

export function getTrsRules(trs: TermRewriteSystem): TRSRule[] {
    const equationRules: TRSRule[] = trs.equations.flatMap(eq => [
        { from: eq.lhs, to: eq.rhs, fromEquation: eq },
        { from: eq.rhs, to: eq.lhs, fromEquation: eq }
    ])
    return trs.rules.concat(equationRules)
}


export function isChangeEmpty(change: TermRewriteSystemChange): boolean {
    return change.addEquation !== undefined ||
        change.addRule !== undefined ||
        change.removeEquation !== undefined ||
        change.removeRule !== undefined
}

export function isChangePairEmpty(changeA: TermRewriteSystemChange, changeB: TermRewriteSystemChange): boolean {
    return (changeA.addEquation === undefined || changeB.removeEquation === changeA.addEquation) &&
        (changeA.addRule === undefined || changeB.removeRule === changeA.addRule)
}

export function applyChange(trs: TermRewriteSystem, change: TermRewriteSystemChange): TermRewriteSystem {
    const newTrs: TermRewriteSystem = {
        equations: trs.equations.filter(eq => !change.removeEquation || !equationsEqual(eq, change.removeEquation)),
        rules: trs.rules.filter(rule => !change.removeRule || !rulesEqual(rule, change.removeRule))
    }

    if (change.addEquation) {
        newTrs.equations.push(change.addEquation)
    }

    if (change.addRule) {
        newTrs.rules.push(change.addRule)
    }

    return newTrs
}