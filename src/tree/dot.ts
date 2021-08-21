import { depthFirst, TreeNode } from "./tree"
import { forEach } from "../generatorutil"

export class Dot {
    private _text = ""

    constructor(name: string) {
        this.addLine(`digraph ${name.replaceAll(" ", "")} {`)
        this.addLine(`    label="${name}";`)
    }

    private addLine(line: string) {
        this._text += `${line}\n`
    }

    addTree(name: string, root: TreeNode) {
        this.addLine(`    subgraph cluster_${name.replaceAll(" ", "")} {`)
        this.addLine("        style=filled;")
        this.addLine(`        label="${name}";`)
        forEach(depthFirst(root), node => {
            this.addLine(`        ${node.index} [label="${node.value}"];`)
            node.children.forEach(child => this.addLine(`        ${node.index} -> ${child.index};`))
        })
        this.addLine("    }")
    }

    get text(): string {
        return `${this._text}}`
    }
}

