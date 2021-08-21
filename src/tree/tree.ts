import { AhoCorasick } from "../matching/ahocorasick"
import { sequenceEqual, subsequenceEqual } from "../util"

export type TreeNode = {
    index: number
    value: string
    children: TreeNode[]
}

export function* depthFirst(root: TreeNode): IterableIterator<TreeNode> {
    const nodeStack = [root]

    while (nodeStack.length > 0) {
        const node = nodeStack.pop()!
        yield node

        for (const child of node.children) {
            nodeStack.push(child)
        }
    }
}

export function eulerTour(root: TreeNode): TreeNode[] {
    const chain: TreeNode[] = []

    function recurse(node: TreeNode, parent?: TreeNode) {
        chain.push(node)
        node.children.forEach(child => recurse(child, node))
        if (parent) {
            chain.push(parent)
        }
    }

    recurse(root)

    return chain
}

export function treeFromEulerTree(eulerTree: EulerTree): TreeNode {
    const root: TreeNode = {
        index: eulerTree.indexChain[0],
        value: eulerTree.valueChain[0],
        children: [],
    }

    const parents: TreeNode[] = []
    let currentNode: TreeNode = root

    for (let i = 1; i < eulerTree.indexChain.length; i++) {
        if (parents.length !== 0 && eulerTree.indexChain[i] === parents[parents.length - 1].index) {
            const parentNode = parents.pop()!
            currentNode = parentNode
        } else {
            const newNode: TreeNode = {
                index: eulerTree.indexChain[i],
                value: eulerTree.valueChain[i],
                children: []
            }
            currentNode.children.push(newNode)
            parents.push(currentNode)
            currentNode = newNode
        }
    }

    return root
}

export type EulerTree = {
    indexChain: number[]
    valueChain: string[]
}

export function makeEulerTree(root: TreeNode): EulerTree {
    const tour = eulerTour(root)
    return {
        indexChain: tour.map(node => node.index),
        valueChain: tour.map(node => node.value),
    }
}

type NumbersFirstLastOccurence = {
    isFirst: boolean[]
    isLast: boolean[]
    lastIndices: Record<number, number>
}

function numbersFirstLastOccurence(ns: number[]): NumbersFirstLastOccurence {
    const seen = new Set<number>() // whether a number has been seen before
    const isFirst: boolean[] = [] // whether each number is the first occurence
    const lastIndices: Record<number, number> = {} // number -> last index of number

    let i = 0;
    // Find the first ones by checking whether we've seen the number before.
    // Also keep track of the last index for each number
    for (const n of ns) {
        isFirst.push(!seen.has(n))
        seen.add(n)
        lastIndices[n] = i++
    }

    // Now build the last booleans by checking which indices are in lastIndices' values
    const isLast: boolean[] = []
    const lastIndicesSet = new Set<number>(Object.values(lastIndices))
    for (i = 0; i < ns.length; i++) {
        isLast.push(lastIndicesSet.has(i))
    }

    return { isFirst, isLast, lastIndices }
}

type SplitByVariables = {
    variables: string[]
    patterns: string[][]
}

function splitByVariables(valueChain: string[]): SplitByVariables {
    const variables: string[] = []
    const patterns: string[][] = []
    let currentPattern: string[] = []
    for (const value of valueChain) {
        if (value.startsWith("$")) {
            patterns.push(currentPattern)
            currentPattern = []
            variables.push(value)
        } else {
            currentPattern.push(value)
        }
    }
    patterns.push(currentPattern)
    return { patterns, variables }
}

function indexOfSequence<T>(input: T[], match: T[], startIndex?: number): number {
    for (let i = (startIndex ?? 0); i < input.length; i++) {
        if (subsequenceEqual(input, match, i)) {
            return i
        }
    }

    return -1
}

function replaceSequence<T>(input: T[], match: T[], replacement: T[]): T[] {
    let index = 0
    let output = [...input]

    while (true) {
        index = indexOfSequence(output, match, index)
        if (index !== -1) {
            output = output.slice(0, index).concat(replacement).concat(output.slice(index + match.length))
        } else {
            break
        }
        index++
    }

    return output
}

export function* eulerTreePatternMatch(input: EulerTree, pattern: EulerTree): IterableIterator<Record<string, EulerTree>> {
    const inputOccurences = numbersFirstLastOccurence(input.indexChain)
    const { patterns, variables } = splitByVariables(pattern.valueChain)

    //console.log("[Pattern Match] patterns:", patterns, "original pattern:", pattern)
    const matcher = new AhoCorasick(patterns)
    const matches: Record<number, Set<string>> = {}
    for (const ahoMatch of matcher.search(input.valueChain)) {
        for (const ahoMatchPattern of ahoMatch[1]) {
            const pattern = ahoMatchPattern.join("|")
            const index = ahoMatch[0] - ahoMatchPattern.length + 1
            if (index in matches) {
                matches[index].add(pattern)
            } else {
                matches[index] = new Set<string>([pattern])
            }
        }
    }

    for (let i = 0; i < input.valueChain.length; i++) {
        const subs: Record<string, EulerTree> = {}

        let j = i
        let fail = false
        for (let p = 0; p < patterns.length; p++) {
            const pattern = patterns[p]

            if (j in matches && matches[j].has(pattern.join("|"))) {
                // For the last pattern we only care that we match, there is no variable substitution after that
                if (p + 1 < patterns.length) {
                    // Check that the first node of the substitution occured here the first time
                    if (inputOccurences.isFirst[j + pattern.length] || p + 1 >= patterns.length) {
                        const nextNodeIndex = input.indexChain[j + pattern.length]

                        // The substitute is the chain from the next index to the last occurence of the node of the next index (including it)
                        const sub: EulerTree = {
                            valueChain: input.valueChain.slice(j + pattern.length, inputOccurences.lastIndices[nextNodeIndex] + 1),
                            indexChain: input.indexChain.slice(j + pattern.length, inputOccurences.lastIndices[nextNodeIndex] + 1),
                        }
                        const variable = variables[p]

                        // Either there is no substitute for the variable yet or the substitute matches the existing one
                        if (!(variable in subs) || sequenceEqual(subs[variable].valueChain, sub.valueChain)) {
                            subs[variable] = sub
                            j += pattern.length + sub.valueChain.length
                        } else {
                            // Inconsistent substitution, doesn't match the old substitution
                            fail = true
                            break
                        }
                    } else {
                        fail = true
                        break
                    }
                }
            } else {
                fail = true
                break
            }
        }

        if (!fail) {
            yield subs
        }
    }
}

export function eulerTreeSubstitute(input: EulerTree, pattern: EulerTree, substitute: EulerTree): EulerTree {
    const firstSubsIter = eulerTreePatternMatch(input, pattern).next()

    const output: EulerTree = {
        indexChain: [...input.indexChain],
        valueChain: [...input.valueChain],
    }

    // No matches found
    if (firstSubsIter.done) {
        return output
    }

    const firstSubs = firstSubsIter.value

    // 1. Insert the variable substitutes into the pattern and substitute.
    // - In the pattern we only need to replace in the value chain.
    // - In the substitute we need to replace in the value chain but we also 
    //   need to make up new unique indices for each node in the substitute 
    //   to fit into the original.
    let patternValueChainSubstituted = pattern.valueChain

    let rndStart = Math.floor(Math.random() * 10000000)

    // Tree to substitute in for the pattern
    const substitutedSubstituteTree: EulerTree = {
        indexChain: substitute.indexChain.map(idx => idx + rndStart), // TODO: Make sure indices are not present in the input already
        valueChain: substitute.valueChain
    }

    // Replace all variables in the pattern and substitute tree with the matched parts in the input for the variables
    for (const [subVariable, subTree] of Object.entries(firstSubs)) {
        // Replace variable in pattern with matched part of input
        patternValueChainSubstituted = replaceSequence(patternValueChainSubstituted, [subVariable], subTree.valueChain)

        // Replace variable in substitute tree with matched part of input
        let index = 0
        while (true) {
            index = substitutedSubstituteTree.valueChain.indexOf(subVariable, index)
            if (index === -1) {
                break
            }

            rndStart = Math.floor(Math.random() * 10000000)
            substitutedSubstituteTree.valueChain = substitutedSubstituteTree.valueChain.slice(0, index)
                .concat(subTree.valueChain)
                .concat(substitutedSubstituteTree.valueChain.slice(index + 1))
            substitutedSubstituteTree.indexChain = substitutedSubstituteTree.indexChain.slice(0, index)
                .concat(subTree.indexChain.map(idx => idx + rndStart))
                .concat(substitutedSubstituteTree.indexChain.slice(index + 1))

            patternValueChainSubstituted = replaceSequence(patternValueChainSubstituted, [subVariable], subTree.valueChain)

            index += subTree.valueChain.length
        }
    }

    // 2. Replace all occurences of the substituted pattern with the substituted substitute.
    let index = 0
    while (true) {
        index = indexOfSequence(output.valueChain, patternValueChainSubstituted, index)
        if (index === -1) {
            break
        }

        rndStart = Math.floor(Math.random() * 10000000)
        output.valueChain = output.valueChain.slice(0, index)
            .concat(substitutedSubstituteTree.valueChain)
            .concat(output.valueChain.slice(index + patternValueChainSubstituted.length))
        output.indexChain = output.indexChain.slice(0, index)
            .concat(substitutedSubstituteTree.indexChain.map(idx => idx + rndStart))
            .concat(output.indexChain.slice(index + patternValueChainSubstituted.length))
        index += substitutedSubstituteTree.valueChain.length
    }

    return output
}