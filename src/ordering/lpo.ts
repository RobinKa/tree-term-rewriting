import { Ordering } from "./ordering"
import { any } from "../generatorutil"
import { depthFirst, TreeNode } from "../tree/tree"

export class LexicographicPathOrdering extends Ordering {
    constructor(private readonly symbols: string[]) {
        super()
    }

    greaterThan(a: TreeNode, b: TreeNode): boolean {
        return this.lpo1(a, b)
    }

    private compareSymbol(a: string, b: string) {
        if (a === b) {
            return 0
        }

        for (const symbol of this.symbols) {
            if (a === symbol && b !== symbol) {
                return 1
            }

            if (a !== symbol && b === symbol) {
                return -1
            }
        }

        return a > b ? 1 : -1
    }

    private isSameSymbol(a: TreeNode, b: TreeNode): boolean {
        return a.children.length === 0 && b.children.length === 0 && a.value === b.value
    }

    private lex1(childrenA: TreeNode[], childrenB: TreeNode[]): boolean {
        if (childrenA.length !== childrenB.length) {
            throw Error("Only functions of fixed arity allowed")
        }

        if (childrenA.length === 0) {
            return false
        }

        if (this.isSameSymbol(childrenA[0], childrenB[0])) {
            return this.lex1(childrenA.slice(1), childrenB.slice(1))
        }

        return this.lpo1(childrenA[0], childrenB[0])
    }

    private alpha1(childrenA: TreeNode[], b: TreeNode): boolean {
        if (childrenA.length === 0) {
            return false
        }

        return this.isSameSymbol(childrenA[0], b) || this.lpo1(childrenA[0], b) || this.alpha1(childrenA.slice(1), b)
    }

    private beta1(a: TreeNode, b: TreeNode): boolean {
        return this.compareSymbol(a.value, b.value) > 0 && this.majo1(a, b.children)
    }

    private gamma1(a: TreeNode, b: TreeNode): boolean {
        return a.value === b.value &&
            this.lex1(a.children, b.children) &&
            this.majo1(a, b.children)
    }

    private delta1(a: TreeNode, b: TreeNode): boolean {
        return any(depthFirst(a), nodeA => this.isSameSymbol(nodeA, b))
    }

    private majo1(a: TreeNode, childrenB: TreeNode[]): boolean {
        if (childrenB.length === 0) {
            return true
        }

        return this.lpo1(a, childrenB[0]) && this.majo1(a, childrenB.slice(1))
    }

    private lpo1(a: TreeNode, b: TreeNode): boolean {
        /*if (a.children.length === 0) {
            return false
        }
    
        if (b.children.length === 0) {
            return delta1(a, b)
        }*/

        return this.alpha1(a.children, b) || this.beta1(a, b) || this.gamma1(a, b)
    }
}