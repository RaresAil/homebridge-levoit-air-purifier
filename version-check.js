const fs = require('fs');
const package = require('./package.json');

console.log('Version: %o', package.version);

if (package.version.includes('-rc')) {
    fs.writeFileSync('.prerelease', 'NPM_EX="--tag prerelease"', 'utf8');
}