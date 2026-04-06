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
                withCredentials([file(credentialsId: 'kubeconfig-file', variable: 'KUBECONFIG_TEMP')]) {
                    sh """
                        mkdir -p /var/jenkins_home/.kube
                        cp \$KUBECONFIG_TEMP /var/jenkins_home/.kube/config

                        # 1. Cambiamos la IP para apuntar al host de Windows
                        sed -i 's/127.0.0.1/host.docker.internal/g' /var/jenkins_home/.kube/config
                        
                        # 2. IMPORTANTE: Eliminamos las referencias a los archivos de certificados 
                        # que causan el error de 'no such file or directory'
                        sed -i '/client-certificate:/d' /var/jenkins_home/.kube/config
                        sed -i '/client-key:/d' /var/jenkins_home/.kube/config
                        sed -i '/certificate-authority:/d' /var/jenkins_home/.kube/config

                        export KUBECONFIG=/var/jenkins_home/.kube/config
                        
                        echo "Deploying to Minikube..."
                        
                        # Usamos --insecure-skip-tls-verify para que no pida los certificados que borramos arriba
                        kubectl apply -f k8s/namespace.yaml --insecure-skip-tls-verify=true --validate=false
                        kubectl apply -f k8s/deployment.yaml --insecure-skip-tls-verify=true --validate=false
                        kubectl apply -f k8s/service.yaml --insecure-skip-tls-verify=true --validate=false
                        
                        # Forzamos el reinicio para que veas tu nombre en el index.js
                        kubectl rollout restart deployment/snapcart-deployment -n snapcart
                    """
                }
            }
        }
    }
}
