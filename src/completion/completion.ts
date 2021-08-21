import { TermRewriteSystem } from "../trs";

export interface Completion {
    complete(trs: TermRewriteSystem): TermRewriteSystem
}