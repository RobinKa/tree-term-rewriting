const fs = require("fs")
const path = require("path")

const filesToCopy = [
    "package.json",
    "yarn.lock",
    "LICENSE",
    "README.md"
]

for (const fileToCopy of filesToCopy) {
    fs.copyFileSync(fileToCopy, path.join("dist", "src", fileToCopy))
}