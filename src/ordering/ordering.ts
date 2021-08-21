import { TreeNode } from "../tree/tree";

export abstract class Ordering {
    abstract greaterThan(a: TreeNode, b: TreeNode): boolean

    compare(a: TreeNode, b: TreeNode) {
        const aGreaterThanB = this.greaterThan(a, b)
        if (aGreaterThanB) {
            return 1
        }

        const bGreaterThanA = this.greaterThan(b, a)
        if (bGreaterThanA) {
            return -1
        }

        return 0
    }
}