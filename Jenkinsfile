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
                docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
            """
            }
        }
        stage('Test') {
            steps {
                sh """
                # Clean up any old container from a previous failed run
                docker rm -f snapcart-test || true

                # Start a temporary container on port 3001
                docker run -d --name snapcart-test -p 3001:3000 ${IMAGE_NAME}:${IMAGE_TAG}

                # Get the internal Docker IP of the container
                TARGET_IP=\$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' snapcart-test)
                echo "Waiting for SnapCart to start at http://\$TARGET_IP:3000..."
                
                # Wait for Next.js to start
                sleep 15
                
                # Check the health endpoint returns 200
                STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://\$TARGET_IP:3000/api/health)
                
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
                    # 1. Ensure kubectl is in the path (adjust if your bin is elsewhere)
                    export PATH="\$PATH:\$(pwd)/bin"

                    # 2. CRITICAL: Bypass proxy for the internal Docker bridge
                    export no_proxy="localhost,127.0.0.1,host.docker.internal,192.168.49.2"
                    export NO_PROXY="localhost,127.0.0.1,host.docker.internal,192.168.49.2"

                    echo "Deploying SnapCart to Kubernetes..."
                    # Using --validate=false prevents timeout issues while downloading schemas
                    kubectl apply -f ${K8S_DIR}/namespace.yaml --validate=false
                    kubectl apply -f ${K8S_DIR}/deployment.yaml --validate=false
                    kubectl apply -f ${K8S_DIR}/service.yaml --validate=false
                    kubectl rollout status deployment/snapcart-deployment \
                        -n ${NAMESPACE} --timeout=120s
                """
            }
        }
    }
}
