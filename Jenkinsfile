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
                    # 1. Usamos la configuración aplanada
                    export KUBECONFIG="/var/jenkins_home/.kube/config"

                    # 2. IMPORTANTE: Cambiamos la IP en el vuelo para que apunte al Host de Windows
                    # Esto reemplaza la IP de Minikube por la dirección especial de Docker
                    sed -i 's/192.168.49.2/host.docker.internal/g' /var/jenkins_home/.kube/config

                    # 3. Bypass de proxies
                    export no_proxy="localhost,127.0.0.1,host.docker.internal"
                    export NO_PROXY="localhost,127.0.0.1,host.docker.internal"
                    unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

                    echo "Deploying SnapCart to Kubernetes..."
                    
                    # 4. Forzamos a kubectl a usar el host.docker.internal
                    kubectl --server=https://host.docker.internal:8443 apply -f ${K8S_DIR}/namespace.yaml --validate=false
                    kubectl --server=https://host.docker.internal:8443 apply -f ${K8S_DIR}/deployment.yaml --validate=false
                    kubectl --server=https://host.docker.internal:8443 apply -f ${K8S_DIR}/service.yaml --validate=false
                    
                    kubectl rollout status deployment/snapcart-deployment -n ${NAMESPACE} --timeout=120s
                """
            }
        }
    }
}
