pipeline {
    agent any

    environment {
        IMAGE_NAME = "snapcart"
        IMAGE_TAG  = "latest"
        NAMESPACE  = "snapcart"
        K8S_DIR    = "k8s"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling latest code from GitHub...'
                checkout scm
                }
            }
        stage('Build Docker Image') {
            steps {
                sh """
                eval \$(minikube docker-env)
                docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
            """
            }
        }
        stage('Test') {
            steps {
                sh """
                eval \$(minikube docker-env)
                # Start a temporary container on port 3001
                docker run -d --name snapcart-test -p 3001:3000 ${IMAGE_NAME}:${IMAGE_TAG}
                
                # Wait for Next.js to start
                sleep 8
                
                # Check the health endpoint returns 200
                STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
                
                # Remove the test container
                docker stop snapcart-test && docker rm snapcart-test
                
                # Fail the build if health check did not return 200
                if [ "\$STATUS" != "200" ]; then
                    echo "Health check failed — HTTP \$STATUS"
                    exit 1
                fi
            """
            }
        }
        stage('Deploy to Kubernetes') {
            steps {
                sh """
                    kubectl apply -f ${K8S_DIR}/namespace.yaml
                    kubectl apply -f ${K8S_DIR}/deployment.yaml
                    kubectl apply -f ${K8S_DIR}/service.yaml
                    kubectl rollout status deployment/snapcart-deployment \
                        -n ${NAMESPACE} --timeout=120s
                """
            }
        }
    }

    post {
        // runs after all stages
    }
}
