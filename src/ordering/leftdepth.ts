import { EulerTree, makeEulerTree, TreeNode } from "../tree/tree";
import { Ordering } from "./ordering";

export class LeftDepthOrdering extends Ordering {
    greaterThan(a: TreeNode, b: TreeNode): boolean {
        return leftDepth(makeEulerTree(a)) > leftDepth(makeEulerTree(b))
    }
}

function leftDepth(eulerTree: EulerTree) {
    if (eulerTree.indexChain.length <= 1) {
        return eulerTree.indexChain.length
    }

    const seen = new Set<number>()
    for (let i = 0; i < eulerTree.indexChain.length; i++) {
        if (seen.has(eulerTree.indexChain[i])) {
            return i
        }

        seen.add(eulerTree.indexChain[i])
    }

    throw Error("Invalid euler tree")
}