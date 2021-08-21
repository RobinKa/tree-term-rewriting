import { EulerTree } from "./tree"

export function replaceVariables(tree: EulerTree): EulerTree {
    const replaced = { ...tree }
    replaced.valueChain = replaced.valueChain.map(v => v.replaceAll("$", ""))
    return replaced
}

export function postfixVariables(tree: EulerTree, postfix: string): EulerTree {
    const replaced = { ...tree }
    replaced.valueChain = replaced.valueChain.map(v => v.replaceAll("$", "") + (v.startsWith("$") ? postfix : ""))
    return replaced
}

export function makePostfixesVariables(tree: EulerTree, postfix: string): EulerTree {
    const replaced = { ...tree }
    replaced.valueChain = replaced.valueChain.map(v => (v.endsWith(postfix) ? "$" : "") + v.replaceAll(postfix, ""))
    return replaced
}