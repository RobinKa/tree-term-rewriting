import { Ordering } from "../ordering"
import { EulerTree, eulerTreeSubstitute, treeFromEulerTree } from "../tree/tree"
import { sequenceEqual } from "../util"
import { EulerRewriteRule, getTrsRules, TermRewriteSystem } from "./trs"

export function applyRules(input: EulerTree, trs: TermRewriteSystem, ordering: Ordering, maxIters?: number): EulerTree {
    let rewritten = {
        indexChain: [...input.indexChain],
        valueChain: [...input.valueChain]
    }

    for (let i = 0; maxIters === undefined || i < maxIters; i++) {
        const rewriteResults = rewrite(rewritten, trs, ordering)
        if (rewriteResults) {
            rewritten = rewriteResults.rewritten
        } else {
            break
        }
    }

    return rewritten
}

export type RewriteResults = {
    rule: EulerRewriteRule
    rewritten: EulerTree
}

export function rewrite(input: EulerTree, trs: TermRewriteSystem, ordering: Ordering): RewriteResults | undefined {
    // Apply all rules once
    for (const rule of getTrsRules(trs)) {
        const rewritten = eulerTreeSubstitute(input, rule.from, rule.to)

        // Only allow rules from equations if they decrease complexity after substitution.
        // Also check that applying the rule actually changed something.
        if ((!rule.fromEquation || ordering.compare(treeFromEulerTree(rewritten), treeFromEulerTree(input)) < 0) &&
            !sequenceEqual(input.valueChain, rewritten.valueChain)) {
            return {
                rewritten,
                rule
            }
        }
    }

    return undefined
}