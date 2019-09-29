/* eslint-disable no-console */
const fs = require('fs')
const path = require('path')
const { spawnSync } = require( 'child_process' )
const prompts = require('prompts')

function getBumpedVersion(number, type) {
    const versionRx = /^(\d).(\d).(\d)$/
    let [, major, patch, fix] = number.match(versionRx)

    switch(type) {
    case 'major':
        return `${parseInt(major, 10) + 1}.0.0`
    case 'minor':
        return `${major}.${parseInt(patch, 10) + 1}.0`
    case 'patch':
        return `${major++}.${patch}.${parseInt(fix, 10) + 1}`
    default:
        throw Error('Argument "type" missing or wrong.')
    }
}

function commitRelease(version) {
    spawnSync('git add .')
    spawnSync(`git commit -m "Release: ${version}"`)
    gitTag(version)
}

function gitTag(version) {
    spawnSync(`git tag ${version} -a "Release: ${version}"`)
    // spawnSync('git push --tags')
}

module.exports = (async function releaseScript() {
    const versionPath = path.join(__dirname, '..', 'version.txt')
    const packageJsonPath = path.join(__dirname, '..', 'package.json')
    try {
        let [,, type] = process.argv
        if (!type) {
            // prompt for type of release
            const { selectedType } = await prompts({
                type: 'select',
                name: 'selectedType',
                message: 'Which type of release?',
                choices: [
                    { title: 'major', value: 'major' },
                    { title: 'minor', value: 'minor' },
                    { title: 'patch', value: 'patch' },
                ],
            })
            type = selectedType
        }
        const version = fs.readFileSync(versionPath, 'utf-8')
        const npmPackage = fs.readFileSync(packageJsonPath, 'utf-8')

        const newVersion = getBumpedVersion(version, type)
        const versionRx = /"version": "(.*)"/

        const { doRelease } = await prompts({
            type: 'confirm',
            name: 'doRelease',
            message: `Do you want to continue with ${newVersion} release?`,
        })

        if (!doRelease) {
            console.log(`
Stopping release.
`)
            return
        }
        console.log(`
Initializing release ${newVersion}.
`)
        const newPackageJson = npmPackage.replace(versionRx, `"version": "${newVersion}"`)
        fs.writeFileSync(packageJsonPath, newPackageJson, 'utf-8')
        // commitRelease(version)
        npm.command.run('build')
    } catch (error) {
        console.log(error.message)
    }
})()
/* eslint-enable no-console */
