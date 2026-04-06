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
                // Esto extrae el archivo de forma segura y lo pone en una ruta temporal
                withCredentials([file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG_TEMP')]) {
                    sh """
                        # 1. Copiamos el archivo seguro a la ruta que espera kubectl
                        mkdir -p /var/jenkins_home/.kube
                        cp \$KUBECONFIG_TEMP /var/jenkins_home/.kube/config

                        # 2. Corregimos la IP para que apunte al host de Windows
                        sed -i 's/192.168.49.2/host.docker.internal/g' /var/jenkins_home/.kube/config
                        
                        # 3. Quitamos las rutas de Windows que causan error
                        # Este comando limpia las referencias a C:\\Users... para que no falle en Linux
                        sed -i 's|C:\\\\Users\\\\josec\\\\.minikube|/var/jenkins_home/.minikube|g' /var/jenkins_home/.kube/config

                        export KUBECONFIG=/var/jenkins_home/.kube/config
                        
                        echo "Deploying to Minikube securely..."
                        kubectl apply -f k8s/namespace.yaml --insecure-skip-tls-verify=true
                        kubectl apply -f k8s/deployment.yaml --insecure-skip-tls-verify=true
                        kubectl apply -f k8s/service.yaml --insecure-skip-tls-verify=true
                    """
                }
            }
        }
    }
}
