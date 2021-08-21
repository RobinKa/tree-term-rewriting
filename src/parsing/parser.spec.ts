import { expect } from "chai";
import { parseExpression } from "./parser";

describe("parser", () => {
    describe("parseExpression() produces correct tree for", () => {
        it("a", () => {
            const treeNode = parseExpression("a")
            expect(treeNode.value).equal("a")
            expect(treeNode.children).empty
        })

        it("$a", () => {
            const treeNode = parseExpression("$a")
            expect(treeNode.value).equal("$a")
            expect(treeNode.children).empty
        })

        it("a + b", () => {
            const treeNode = parseExpression("a + b")
            expect(treeNode.value).equal("+")
            expect(treeNode.children).length(2)
            expect(treeNode.children[0].value).equal("a")
            expect(treeNode.children[0].children).empty
            expect(treeNode.children[1].value).equal("b")
            expect(treeNode.children[1].children).empty
        })

        it("$a + a", () => {
            const treeNode = parseExpression("$a + a")
            expect(treeNode.value).equal("+")
            expect(treeNode.children).length(2)
            expect(treeNode.children[0].value).equal("$a")
            expect(treeNode.children[0].children).empty
            expect(treeNode.children[1].value).equal("a")
            expect(treeNode.children[1].children).empty
        })

        it("a * (b + c)", () => {
            const treeNode = parseExpression("a * (b + c)")
            expect(treeNode.value).equal("*")
            expect(treeNode.children).length(2)

            expect(treeNode.children[0].value).equal("a")
            expect(treeNode.children[0].children).empty

            expect(treeNode.children[1].value).equal("+")
            expect(treeNode.children[1].children).length(2)

            expect(treeNode.children[1].children[0].value).equal("b")
            expect(treeNode.children[1].children[0].children).empty

            expect(treeNode.children[1].children[1].value).equal("c")
            expect(treeNode.children[1].children[1].children).empty
        })

        it("a * b + c", () => {
            const treeNode = parseExpression("a * b + c")
            expect(treeNode.value).equal("+")
            expect(treeNode.children).length(2)
            
            expect(treeNode.children[0].value).equal("*")
            expect(treeNode.children[0].children).length(2)

            expect(treeNode.children[0].children[0].value).equal("a")
            expect(treeNode.children[0].children[0].children).empty

            expect(treeNode.children[0].children[1].value).equal("b")
            expect(treeNode.children[0].children[1].children).empty

            expect(treeNode.children[1].value).equal("c")
            expect(treeNode.children[1].children).empty
        })

        it("a + -b", () => {
            const treeNode = parseExpression("a + -b")
            expect(treeNode.value).equal("+")
            expect(treeNode.children).length(2)

            expect(treeNode.children[0].value).equal("a")
            expect(treeNode.children[0].children).empty
            
            expect(treeNode.children[1].value).equal("-")
            expect(treeNode.children[1].children).length(1)

            expect(treeNode.children[1].children[0].value).equal("b")
            expect(treeNode.children[1].children[0].children).empty
        })

        it("a - b", () => {
            const treeNode = parseExpression("a - b")
            expect(treeNode.value).equal("-")
            expect(treeNode.children).length(2)

            expect(treeNode.children[0].value).equal("a")
            expect(treeNode.children[0].children).empty
            
            expect(treeNode.children[1].value).equal("b")
            expect(treeNode.children[1].children).empty
        })

        it("a - -b", () => {
            const treeNode = parseExpression("a - -b")
            expect(treeNode.value).equal("-")
            expect(treeNode.children).length(2)

            expect(treeNode.children[0].value).equal("a")
            expect(treeNode.children[0].children).empty
            
            expect(treeNode.children[1].value).equal("-")
            expect(treeNode.children[1].children).length(1)

            expect(treeNode.children[1].children[0].value).equal("b")
            expect(treeNode.children[1].children[0].children).empty
        })

        it("f()", () => {
            const treeNode = parseExpression("f()")
            console.log(JSON.stringify(treeNode))
            expect(treeNode.value).equal("f")
            expect(treeNode.children).length(0)
        })

        it("f(a)", () => {
            const treeNode = parseExpression("f(a)")
            console.log(JSON.stringify(treeNode))
            expect(treeNode.value).equal("f")
            expect(treeNode.children).length(1)

            expect(treeNode.children[0].value).equal("a")
            expect(treeNode.children[0].children).empty
        })

        it("f(a, b, c)", () => {
            const treeNode = parseExpression("f(a, b, c)")
            console.log(JSON.stringify(treeNode))
            expect(treeNode.value).equal("f")
            expect(treeNode.children).length(3)

            expect(treeNode.children[0].value).equal("a")
            expect(treeNode.children[0].children).empty

            expect(treeNode.children[1].value).equal("b")
            expect(treeNode.children[1].children).empty

            expect(treeNode.children[2].value).equal("c")
            expect(treeNode.children[2].children).empty
        })
    })
})
