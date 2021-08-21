import { describe, it } from "mocha"
import { expect } from "chai"
import { eulerTour, EulerTree, makeEulerTree, depthFirst, treeFromEulerTree, TreeNode, eulerTreePatternMatch } from "./tree"
import { forEach } from "../generatorutil"
import { parseExpression } from "../parsing/parser"

const inferKeyType = <T>(x: Record<keyof T, TreeNode>) => x
const testRoots = inferKeyType({
    "a": {
        index: 0,
        value: "a",
        children: []
    },
    "a->(b,c)": {
        index: 0,
        value: "a",
        children: [
            {
                index: 1,
                value: "b",
                children: []
            },
            {
                index: 2,
                value: "c",
                children: []
            },
        ]
    },
    "a->b->c->d": {
        index: 0,
        value: "a",
        children: [
            {
                index: 1,
                value: "b",
                children: [
                    {
                        index: 2,
                        value: "c",
                        children: [
                            {
                                index: 3,
                                value: "d",
                                children: []
                            },
                        ]
                    },
                ]
            },
        ]
    },
    "a->(b,c,d)": {
        index: 0,
        value: "a",
        children: [
            {
                index: 1,
                value: "b",
                children: []
            },
            {
                index: 2,
                value: "c",
                children: []
            },
            {
                index: 3,
                value: "d",
                children: []
            },
        ]
    },
})

type TreeName = keyof typeof testRoots

const testValueChains: Record<TreeName, string> = {
    "a": "a",
    "a->(b,c)": "a,b,a,c,a",
    "a->b->c->d": "a,b,c,d,c,b,a",
    "a->(b,c,d)": "a,b,a,c,a,d,a",
}

const testIndexChains: Record<TreeName, string> = {
    "a": "0",
    "a->(b,c)": "0,1,0,2,0",
    "a->b->c->d": "0,1,2,3,2,1,0",
    "a->(b,c,d)": "0,1,0,2,0,3,0",
}

const treeNames = Object.keys(testRoots) as TreeName[]

const testEulerTrees: Record<TreeName, EulerTree> = Object.fromEntries(treeNames.map(treeName => [
    treeName,
    {
        indexChain: testIndexChains[treeName].split(",").map(s => parseInt(s)),
        valueChain: testValueChains[treeName].split(",")
    }
])) as Record<TreeName, EulerTree>

function getTreeNodes(root: TreeNode): TreeNode[] {
    const nodeStack = [root]
    const nodes = []

    while (nodeStack.length > 0) {
        const node = nodeStack.pop()!
        nodes.push(node)

        for (const child of node.children) {
            nodeStack.push(child)
        }
    }

    return nodes
}

const testNodes = Object.fromEntries(treeNames.map(treeName => [treeName, getTreeNodes(testRoots[treeName])])) as Record<TreeName, TreeNode[]>

const treeTests = (treeName: TreeName, root: TreeNode) => {
    const nodes = testNodes[treeName]
    describe("traverseDepthFirst()", () => {
        it("traverses all nodes once", () => {
            const visitCountByIndex: Record<number, number> = Object.fromEntries(nodes.map(node => [node.index, 0]))
            forEach(depthFirst(root), node => visitCountByIndex[node.index]++)
            for (const visitCount of Object.values(visitCountByIndex)) {
                expect(visitCount).equal(1)
            }
        })

        it("has depth first ordering", () => {
            const dfsNodes: TreeNode[] = []
            forEach(depthFirst(root), node => dfsNodes.push(node))
            expect(dfsNodes).deep.equal(nodes)
        })
    })

    describe("eulerTour()", () => {
        it("contains node #children+1 times", () => {
            const eulerNodes = eulerTour(root)
            const indexCounts: Record<number, number> = Object.fromEntries(nodes.map(node => [node.index, 0]))
            eulerNodes.forEach(node => indexCounts[node.index]++)

            for (const node of nodes) {
                expect(indexCounts[node.index]).equal(node.children.length + 1)
            }
        })
    })

    describe("makeEulerTree()", () => {
        const eulerTree = makeEulerTree(root)
        it("gives correct value chain", () => {
            expect(eulerTree.valueChain.join()).equal(testValueChains[treeName])
        })
        it("gives correct index chain", () => {
            expect(eulerTree.indexChain.join()).equal(testIndexChains[treeName])
        })
    })
}

describe("tree", () => {
    for (const [treeName, treeRoot] of Object.entries(testRoots) as [TreeName, TreeNode][]) {
        describe(treeName, () => treeTests(treeName, treeRoot))
    }
})

const eulerTreeTests = (treeName: TreeName, eulerTree: EulerTree) => {
    const nodes = testNodes[treeName]
    describe("treeFromEulerTree()", () => {
        const convertedTree = treeFromEulerTree(eulerTree)
        const convertedNodes = getTreeNodes(convertedTree)

        it("has same number of nodes", () => {
            expect(nodes.length).equal(convertedNodes.length)
        })

        it("has correct nodes", () => {
            for (let i = 0; i < nodes.length; i++) {
                expect(nodes[i].index).equal(convertedNodes[i].index)
                expect(nodes[i].value).equal(convertedNodes[i].value)
            }
        })
    })
}

describe("eulerTree", () => {
    for (const [treeName, eulerTree] of Object.entries(testEulerTrees) as [TreeName, EulerTree][]) {
        describe(treeName, () => eulerTreeTests(treeName, eulerTree))
    }

    describe("eulerTreePatternMatch()", () => {
        it("should match a + b + c | $x + $y", () => {
            const matches = [...eulerTreePatternMatch(makeEulerTree(parseExpression("a + b + c")), makeEulerTree(parseExpression("$x + $y")))]
            console.log("Matches:", JSON.stringify(matches))
            expect(matches).length(2)
        })

        it("should match a + b + c | a + $x", () => {
            const matches = [...eulerTreePatternMatch(makeEulerTree(parseExpression("a + b + c")), makeEulerTree(parseExpression("a + $x")))]
            console.log("Matches:", JSON.stringify(matches))
            expect(matches).length(1)
        })
    })
})
