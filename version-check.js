const fs = require("fs");
const package = require("./package.json");

console.log("Version: %o", package.version);

if (package.version.includes("-rc")) {
  const name = package.version
    .split("-rc")[1]
    .slice(package.version.indexOf(".") + 1, package.version.length);

  fs.writeFileSync(".prerelease", `NPM_EX="--tag prerelease-${name}"`, "utf8");
}
