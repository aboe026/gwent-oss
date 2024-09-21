@Library('aboe026') _ // groovylint-disable-line VariableName, UnusedVariable

import org.aboe026.DockerUtil
import org.aboe026.ShieldsIoBadges
import org.aboe026.Xml

node {
    def workDir = "${WORKSPACE}/${env.BRANCH_NAME}-${env.BUILD_ID}"
    def nodeImage = 'node:20'
    def baseImage = 'node:20-alpine'
    def composeVersion = '2.14.0'
    def dockerRegistry = 'localhost:5000'
    def composeFileName = 'docker-compose.yaml'
    def e2eSuites = [
        [
            name: 'Chrome',
            browser: 'chromium --disable-dev-shm-usage --no-sandbox'
        ]
    ]
    def badges = new ShieldsIoBadges(this, 'gwent')
    def dockerUtil = new DockerUtil(this)
    def upload = env.BRANCH_NAME == 'main'
    def dockerVolumesToDelete = []
    def mountDir = ''
    def exceptionThrown = false
    def packageJson
    def projectName
    def dockerTag
    def dockerPushTag
    def uniqueName
    def composeYaml
    def mongoImage
    def testcafeVersion
    def testcafeImageTag
    def e2eDbName
    def services = []

    try {
        timeout(time: 30, unit: 'MINUTES') {
            ansiColor('xterm') {
                dir(workDir) {
                    stage('Prep') {
                        checkout scm

                        def packageJsonName = 'package.json'
                        packageJson = readJSON file: packageJsonName
                        projectName = packageJson.name.split('/')[0].replace('@', '')
                        dockerTag = "${packageJson.version}-${env.BRANCH_NAME.replace('-', '')}.${env.BUILD_ID}".toLowerCase()
                        dockerPushTag = "${packageJson.version}-${env.BUILD_ID}"
                        uniqueName = "${projectName}--${dockerTag}".replace('.', '-')
                        currentBuild.displayName = "${packageJson.version}+${env.BUILD_ID}"

                        dir('test/e2e') {
                            def e2ePackageJson = readJSON file: packageJsonName
                            testcafeVersion = e2ePackageJson.dependencies.testcafe
                            testcafeImageTag = "${e2ePackageJson.dependencies.testcafe}--${uniqueName}"

                            // explicitly create directories to avoid EACCES: permission denied from testcafe/testcafe container
                            sh 'mkdir test-results'
                            sh 'chmod -R 777 test-results'
                            sh 'mkdir screenshots'
                            sh 'chmod -R 777 screenshots'
                            sh 'mkdir perf'
                            sh 'chmod -R 777 perf'
                        }
                        e2eDbName = "${projectName}-e2e"

                        // determine host mounted directory for correct volume mounting of testcafe container
                        mountDir = dockerUtil.getHostMountDir(workDir: workDir)

                        // get services to build
                        dir('svcs') {
                            def serviceFiles = findFiles()

                            serviceFiles.each { serviceFile ->
                                if (serviceFile.directory) {
                                    services.push(serviceFile.name)
                                }
                            }
                        }

                        // mongo image
                        dir('compose') {
                            composeYaml = readYaml file: composeFileName
                        }
                        mongoImage = composeYaml.services.database.image
                    }
                    stage('Install Compose') {
                        sh "curl -L 'https://github.com/docker/compose/releases/download/v${composeVersion}/docker-compose-linux-x86_64' -o /usr/local/bin/docker-compose"
                        sh 'chmod +x /usr/local/bin/docker-compose'
                        sh 'docker-compose --version'
                        sh "docker network create ${uniqueName}"
                    }
                    stage('Pull Images') {
                        sh "docker pull ${mongoImage}"
                        sh "docker pull ${nodeImage}"
                        sh "docker pull ${baseImage}"
                        sh "docker pull testcafe/testcafe:${testcafeVersion}"
                    }

                    parallel(
                        'node': {
                            docker.image(mongoImage).withRun("--name=${uniqueName}-mongo --network=${uniqueName}") {
                                dockerVolumesToDelete.addAll(dockerUtil.getContainerVolumes(containerName: "${uniqueName}-mongo"))
                                docker.image(nodeImage).inside("--network=${uniqueName}") {
                                    stage('Install') {
                                        sh 'node --version'
                                        sh 'yarn --version'
                                        sh 'yarn install --immutable'
                                    }
                                    stage('Lint') {
                                        sh 'yarn lint'
                                    }
                                    stage('Build') {
                                        sh 'yarn build'
                                    }
                                    stage('Unit Test') {
                                        try {
                                            sh 'yarn test-unit'
                                        } catch (err) {
                                            exceptionThrown = true
                                            println 'Exception was caught in try block of unit tests stage.'
                                            println err
                                        } finally {
                                            junit testResults: 'test-results/unit.xml', allowEmptyResults: true
                                            recordCoverage(
                                                skipPublishingChecks: true,
                                                sourceCodeRetention: 'EVERY_BUILD',
                                                tools: [
                                                    [
                                                        parser: 'COBERTURA',
                                                        pattern: 'coverage/unit/cobertura-coverage.xml'
                                                    ]
                                                ]
                                            )
                                            if (upload) {
                                                badges.uploadCoverageResult(
                                                    branch: env.BRANCH_NAME
                                                )
                                            }
                                        }
                                    }
                                    stage('Func Test') {
                                        try {
                                            withEnv([
                                                "MONGO_URL=mongodb://${uniqueName}-mongo:27017",
                                                'MONGO_DB=gwent-func'
                                            ]) {
                                                sh 'yarn test-func'
                                            }
                                        } catch (err) {
                                            exceptionThrown = true
                                            println 'Exception was caught in try block of func tests stage.'
                                            println err
                                        } finally {
                                            junit testResults: 'test-results/func.xml', allowEmptyResults: true
                                        }
                                    }
                                }
                            }
                        },
                        'docker': {
                            stage('Build Images') {
                                def dockerBuilds = [:]
                                services.each { service ->
                                    dockerBuilds[service] = {
                                        dir("svcs/${service}") {
                                            sh """docker build \
                                                --tag=${projectName}-${service}:${dockerTag} \
                                                --build-arg VERSION=${packageJson.version} \
                                                --build-arg BUILD=${env.BUILD_ID} \
                                                --no-cache \
                                                --progress=plain \
                                                --file=Dockerfile \
                                                ../../
                                            """
                                        }
                                    }
                                }
                                dockerBuilds['testcafe'] = {
                                    dir('test/e2e') {
                                        sh """docker build \
                                            --tag=testcafe/testcafe:${testcafeImageTag} \
                                            --no-cache \
                                            --progress=plain \
                                            .
                                        """
                                    }
                                }
                                parallel dockerBuilds
                            }
                        }
                    )

                    stage('Start') {
                        dir('compose') {
                            // make unique to build
                            sh "sed -i -e 's/COMPOSE_PROJECT_NAME=.*/COMPOSE_PROJECT_NAME=${uniqueName}/g' .env"
                            sh "sed -i -e 's/HOST_NAME=.*/HOST_NAME=${uniqueName}-router-1/g' .env"
                            composeYaml.services.router.image = "${projectName}-router:${dockerTag}"
                            composeYaml.services.router.remove('ports') // remove exposed port to avoid port conflicts
                            services.each { service ->
                                // refer to service images built earlier to avoid re-build
                                composeYaml.services[service].image = "${projectName}-${service}:${dockerTag}"
                            }
                            composeYaml.services.router.volumes[0] = "${mountDir}/compose/nginx/nginx.conf:/etc/nginx/nginx.conf"
                            composeYaml.services.api.environment.push("MONGO_DB=${projectName}-e2e")
                            composeYaml.services.api.environment.push('SESSION_TIMEOUT_SECONDS=20')
                            composeYaml.networks = [
                                default: [
                                    name: uniqueName
                                ]
                            ]
                            writeYaml file: composeFileName, data: composeYaml, overwrite: true

                            sh 'docker-compose build router --no-cache'
                            sh 'docker-compose up -d'
                        }
                    }

                    e2eSuites.each { e2eSuite ->
                        runE2eTest(
                            "E2E ${e2eSuite.name}",
                            "e2e-${e2eSuite.name.toLowerCase()}",
                            e2eSuite.browser,
                            uniqueName,
                            mountDir,
                            testcafeImageTag,
                            e2eDbName
                        )
                    }
                    archiveArtifacts artifacts: 'test/e2e/screenshots/**/*', allowEmptyArchive: true
                    dockerVolumesToDelete.addAll(dockerUtil.getContainerVolumes(containerName: "${uniqueName}-database-1"))

                    if (upload) {
                        stage('Push') {
                            if (isBuildSucceeding()) {
                                docker.withRegistry(dockerRegistry) {
                                    def dockerPushes = [:]
                                    services.each { service ->
                                        dockerPushes[service] = {
                                            dir("svcs/${service}") {
                                                def imageName = "${projectName}-${service}"
                                                def pushImageName = "${dockerRegistry}/${imageName}"
                                                sh "docker tag ${imageName}:${dockerTag} ${pushImageName}:${dockerPushTag}"
                                                sh "docker tag ${imageName}:${dockerTag} ${pushImageName}:latest"
                                                sh "docker push ${pushImageName}:${dockerPushTag}"
                                                sh "docker push ${pushImageName}:latest"
                                            }
                                        }
                                    }

                                    parallel dockerPushes
                                }
                            } else {
                                println "Build status of '${currentBuild.currentResult}' does not equal '${hudson.model.Result.SUCCESS}', not pushing images"
                            }
                        }
                    }
                }
            }
        }
    } catch (err) {
        exceptionThrown = true
        println 'Exception was caught in try block of jenkins job.'
        println err
    }  finally {
        if (upload) {
            badges.uploadBuildResult(
                branch: env.BRANCH_NAME
            )
        }
        stage('Cleanup') {
            try {
                dir("${workDir}/compose") {
                    sh "docker-compose logs > ${uniqueName}-compose.log"
                    archiveArtifacts artifacts: "${uniqueName}-compose.log", allowEmptyArchive: true
                }
            } catch (err) {
                println 'Exception caught when trying to get docker-compose logs'
            }
            try {
                dir("${workDir}/compose") {
                    sh 'docker-compose down -v --rmi \'local\''
                }
            } catch (err) {
                println 'Exception caught when trying to bring down compose containers'
                println err
            }
            services.addAll('router', 'database')
            services.each { service ->
                def containerName = "${uniqueName}-${service}-1"
                try {
                    sh "docker stop ${containerName}"
                } catch (err) {
                    println "non-fatal error trying to stop docker container ${containerName}"
                    println err
                }
                try {
                    sh "docker rm ${containerName}"
                } catch (err) {
                    println "non-fatal error trying to remove docker container ${containerName}"
                    println err
                }
                def imageName = "${projectName}-${service}:${dockerTag}"
                try {
                    sh "docker rmi ${imageName}"
                } catch (err) {
                    println "non-fatal error trying to remove docker image ${imageName}"
                    println err
                }
            }
            e2eSuites.each { e2eSuite ->
                def testcafeContainer = "${uniqueName}-e2e-${e2eSuite.name.toLowerCase()}"
                try {
                    sh "docker stop ${testcafeContainer}"
                } catch (err) {
                    println "non-fatal error trying to stop docker container ${testcafeContainer}"
                    println err
                }
                try {
                    sh "docker rm ${testcafeContainer}"
                } catch (err) {
                    println "non-fatal error trying to remove docker container ${testcafeContainer}"
                    println err
                }
            }
            def testcafeImage = "testcafe/testcafe:${testcafeImageTag}"
            try {
                sh "docker rmi ${testcafeImage}"
            } catch (err) {
                println "non-fatal error trying to remove docker image ${testcafeImage}"
                println err
            }
            try {
                sh "docker network rm ${uniqueName}"
            } catch (err) {
                println "non-fatal error trying to remove docker network '${uniqueName}'"
                println err
            }
            dockerVolumesToDelete.each { volume ->
                try {
                    sh "docker volume rm ${volume}"
                } catch (err) {
                    println "non-fatal error trying to remove docker volume '${volume}'"
                    println err
                }
            }
            try {
                sh "rm -rf ${workDir}"
            } catch (err) {
                println 'Exception deleting working directory'
                println err
            }
            try {
                sh "rm -rf ${workDir}@tmp"
            } catch (err) {
                println 'Exception deleting temporary working directory'
                println err
            }
            if (exceptionThrown) {
                error('Exception was thrown earlier')
            }
        }
    }
}

def runE2eTest(String displayName, String suiteName, String browser, String uniqueName, String mountDir, String testcafeImageTag, String dbName) {
    def exceptionThrown = false
    stage(displayName) {
        try {
            sh """docker run \
                --rm \
                --name=${uniqueName}-${suiteName} \
                --shm-size=2g \
                --network=${uniqueName} \
                -v ${mountDir}:/app \
                -w /app/test/e2e \
                -e BASE_URL=https://${uniqueName}-router-1 \
                -e API_URL=https://${uniqueName}-router-1/graphql \
                -e MONGO_URL=mongodb://${uniqueName}-database-1:27017 \
                -e MONGO_DB=${dbName} \
                -e BUILD=${env.BUILD_ID} \
                -e WEBGL_UNSUPPORTED=${browser == 'firefox' ? 'true' : 'false'} \
                -e NODE_TLS_REJECT_UNAUTHORIZED=0 \
                -e CONCURRENCY=8 \
                -i testcafe/testcafe:${testcafeImageTag} \
                    \'${browser} --ignore-certificate-errors\' \
                    build/src/tests \
                    --config-file=build/.testcaferc.js \
                    --reporter spec,xunit:test-results/${suiteName}.xml \
                    --quarantine-mode \
                    --screenshots path=screenshots/,takeOnFails=true
            """
        } catch (err) {
            exceptionThrown = true
            println "Exception was caught in try block of suite '${suiteName}' tests stage."
            println err
        } finally {
            dir('test/e2e') {
                def filePath = "test-results/${suiteName}.xml"
                if (fileExists(filePath)) {
                    def contents = readFile filePath
                    if (contents) {
                        try {
                            def unstableTests = []
                            writeFile(
                                file: filePath,
                                text: Xml.transform(readFile(file: filePath)) { root ->
                                    root.each { testsuite ->
                                        testsuite.testcase.each { testcase ->
                                            def unstable = false
                                            def testcaseClass = testcase['@classname'].text()
                                            testcase['@classname'] = "${suiteName}.${testcaseClass}".toString()
                                            def testcaseName = testcase['@name'].text()
                                            if (testcaseName.contains('(unstable)')) {
                                                unstable = true
                                            }
                                            testcaseName = testcaseName
                                                .replaceAll(/ \(unstable\)/, '')
                                                .replaceAll(/ \(screenshots: \S+\)/, '')
                                            if (unstable) {
                                                unstableTests.push("${testcaseClass}.${testcaseName}")
                                            }
                                            testcase['@name'] = testcaseName
                                        }
                                    }
                                }
                            )
                            if (unstableTests) {
                                def unstableFileName = 'unstable-tests.txt'
                                writeFile(
                                    file: unstableFileName,
                                    text: unstableTests.join('\n')
                                )
                                archiveArtifacts artifacts: unstableFileName
                            }
                        } catch (er) {
                            exceptionThrown = true
                            println "Exception caught in try block of finally block of suite '${suiteName}' tests stage."
                            println er
                        }
                        junit testResults: filePath
                    } else {
                        exceptionThrown = true
                        println "Results file '${filePath}' for suite '${suiteName}' empty"
                    }
                } else {
                    exceptionThrown = true
                    println "Results file '${filePath}' for suite '${suiteName}' not found"
                }
            }
        }
    }
    if (exceptionThrown) {
        unstable(message: "Error occured running '${suiteName}' tests")
    }
}

def isBuildSucceeding() {
    return hudson.model.Result.SUCCESS.toString() == currentBuild.currentResult
}
