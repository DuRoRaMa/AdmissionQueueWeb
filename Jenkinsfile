properties([
    pipelineTriggers([
        githubPush()
    ])
])

pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        FRONTEND_DIR = '/home/vinogradov.vs/pk-services/Queue/AdmissionQueueWeb'
        COMPOSE_FILE = 'docker-compose.prod.yml'
        ENV_FILE = '.env.prod'
    }

    stages {
        stage('Check branch') {
            steps {
                script {
                    if (env.BRANCH_NAME && env.BRANCH_NAME != 'main') {
                        currentBuild.result = 'NOT_BUILT'
                        error('Deploy is allowed only from main branch')
                    }
                }
            }
        }

        stage('Pull frontend') {
            steps {
                sh '''
                    set -e
                    cd "$FRONTEND_DIR"
                    git fetch origin main
                    git reset --hard origin/main
                    git clean -fd
                '''
            }
        }

        stage('Check env') {
            steps {
                sh '''
                    set -e
                    test -f "$FRONTEND_DIR/$ENV_FILE"
                    grep -q "VITE_API_URL=" "$FRONTEND_DIR/$ENV_FILE"
                    grep -q "VITE_BASE_URL=" "$FRONTEND_DIR/$ENV_FILE"
                    grep -q "VITE_WS_URL=" "$FRONTEND_DIR/$ENV_FILE"
                    grep -q "VITE_PUBLIC_BASE_PATH=/queue/" "$FRONTEND_DIR/$ENV_FILE"
                '''
            }
        }

        stage('Build frontend') {
            steps {
                sh '''
                    set -e
                    cd "$FRONTEND_DIR"
                    sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --pull
                '''
            }
        }

        stage('Deploy frontend') {
            steps {
                sh '''
                    set -e
                    cd "$FRONTEND_DIR"
                    sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans
                '''
            }
        }

        stage('Smoke test frontend') {
            steps {
                sh '''
                    set -e
                    curl -fsS http://127.0.0.1:18081/health/
                    sudo docker ps --filter "name=aq-frontend-prod"
                '''
            }
        }
    }

    post {
        failure {
            sh '''
                cd "$FRONTEND_DIR" || exit 0
                sudo docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps || true
                sudo docker logs --tail=100 aq-frontend-prod || true
            '''
        }
    }
}