import { Additive, ASTKinds, Constant, Equality, Expression, FunctionApplication, FunctionCall, Multiplicative, parse, Primary, Unary, Variable } from "./__generated__/math"
import { makeEulerTree, TreeNode } from "../tree/tree"
import { EulerRewriteRule, RewriteRule } from "../trs"

function astToTree(root: Expression): TreeNode {
    let nextNodeIndex = 0

    type BinaryOperator<TOp extends string, TChild> = {
        head: TChild
        tail: { sm: TChild, op: TOp }[]
    }

    function binaryOperatorToTreeNode<TOp extends string, TChild>(node: BinaryOperator<TOp, TChild>, childToTreeNode: (child: TChild) => TreeNode) {
        return node.tail.reduce((prev: TreeNode, curr): TreeNode => {
            return {
                index: nextNodeIndex++,
                value: curr.op,
                children: [
                    prev,
                    childToTreeNode(curr.sm)
                ]
            }
        }, childToTreeNode(node.head))
    }

    const functionCallToTreeNode = (node: FunctionCall): TreeNode => {
        return {
            index: nextNodeIndex++,
            value: node.fn.name,
            children: node.args.kind === ASTKinds.FunctionCallArgs_1 ? [] :
                [node.args.head].concat(node.args.tail.map(t => t.sm)).map(expressionToTreeNode)
        }
    }

    function constantToTreeNode(node: Constant): TreeNode {
        return {
            index: nextNodeIndex++,
            value: node.value,
            children: [],
        }
    }

    function variableToTreeNode(node: Variable): TreeNode {
        return {
            index: nextNodeIndex++,
            value: node.name,
            children: [],
        }
    }

    function primaryToTreeNode(node: Primary): TreeNode {
        switch (node.kind) {
            case ASTKinds.Primary_1:
                return expressionToTreeNode(node.expression)
            case ASTKinds.Primary_2:
                return functionCallToTreeNode(node.functionCall)
            case ASTKinds.Primary_3:
                return variableToTreeNode(node.variable)
            case ASTKinds.Primary_4:
                return constantToTreeNode(node.constant)
        }
    }

    function unaryToTreeNode(node: Unary): TreeNode {
        return node.head.reduce((prev: TreeNode, curr): TreeNode => {
            return {
                index: nextNodeIndex++,
                value: curr.op,
                children: [prev],
            }
        }, primaryToTreeNode(node.primary))
    }

    // Binary operators
    const functionApplicationToTreeNode = (node: FunctionApplication) => binaryOperatorToTreeNode(node, unaryToTreeNode)
    const multiplicativeToTreeNode = (node: Multiplicative) => binaryOperatorToTreeNode(node, functionApplicationToTreeNode)
    const additiveToTreeNode = (node: Additive) => binaryOperatorToTreeNode(node, multiplicativeToTreeNode)
    const equalityToTreeNode = (node: Equality) => binaryOperatorToTreeNode(node, additiveToTreeNode)
    const expressionToTreeNode = (node: Expression) => equalityToTreeNode(node.equality)

    return expressionToTreeNode(root)
}

export function parseExpression(expr: string): TreeNode {
    const parseResult = parse(expr)
    if (parseResult.errs.length > 0 || !parseResult.ast) {
        throw Error(`Errors parsing ${expr} ${JSON.stringify(parseResult, undefined, 2)}`)
    }
    return astToTree(parseResult.ast)
}

export function parseRewriteRule(rule: string): RewriteRule {
    const ruleSplit = rule.split("->")
    if (ruleSplit.length !== 2) {
        throw Error("Input must have only one arrow")
    }

    return {
        from: parseExpression(ruleSplit[0]),
        to: parseExpression(ruleSplit[1])
    }
}

export function parseEulerRewriteRule(rule: string): EulerRewriteRule {
    const { from, to } = parseRewriteRule(rule)
    const toEuler = makeEulerTree(to)
    toEuler.indexChain = toEuler.indexChain.map(index => index + 10000)
    return {
        from: makeEulerTree(from),
        to: toEuler
    }
}
