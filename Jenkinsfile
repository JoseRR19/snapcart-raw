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
                        # 1. Creamos la carpeta interna de Jenkins
                        mkdir -p /var/jenkins_home/.kube

                        # 2. Pegamos el contenido 'flattened' aquí mismo
                        # (Reemplaza desde 'apiVersion' hasta el final con tu texto)
                        cat <<EOF > /var/jenkins_home/.kube/config
                        apiVersion: v1
                        clusters:
                        - cluster:
                            certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCakNDQWU2Z0F3SUJBZ0lCQVRBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwdGFXNXAKYTNWaVpVTkJNQjRYRFRJMk1ESXhNVEF5TURZeU1Gb1hEVE0yTURJeE1EQXlNRFl5TUZvd0ZURVRNQkVHQTFVRQpBeE1LYldsdWFXdDFZbVZEUVRDQ0FTSXdEUVlKS29aSWh2Y05BUUVCQlFBRGdnRVBBRENDQVFvQ2dnRUJBTUI0CjJZRDRLanluV01BeU1HbWpTeWxKT3lJUU1wc0RVVzN3VENTV21xZTZHODltd3hRb0xlNjl1VXhmVERnb0FJdVMKWmJJeHpNTFM1bWhPY1ZEVmVScmZzOTNkY0kzNVg5Y1VJczN6N01RNXd6RXllN0MwTnpScE03TG1rS2dZbFRJVgpHTTBsOUdLaTZHTS93Qk5HVnB6RmlqMGVMcjhTVS9WNUU1YlNSTGUxb3FNUWV5SkNpQ0M4bWdUcXp3aHIzWFEvCjVFZ3g0QldIN0xUR0hBM1hwZUFBWEswTXRYSU82SkRCT25VTHROV1d5cjNUYWVveHVaaVVTbVBmOUpWMWxtNjcKU3ZxZ3p3cXpOc0hnVDlKWVZPaHJGMzJ1R2wrZE5MTVZGVUtKcmpJcERpejdVMWFZaXk3ek8rRkdEa2hJWjlROQpDOSt2MGkxbzl1Y3YwazdFdUNjQ0F3RUFBYU5oTUY4d0RnWURWUjBQQVFIL0JBUURBZ0trTUIwR0ExVWRKUVFXCk1CUUdDQ3NHQVFVRkJ3TUNCZ2dyQmdFRkJRY0RBVEFQQmdOVkhSTUJBZjhFQlRBREFRSC9NQjBHQTFVZERnUVcKQkJTZzBrOFlRaUhmM2l1ZzFaa2dXU2VpU2V4dSt6QU5CZ2txaGtpRzl3MEJBUXNGQUFPQ0FRRUFXc1JNMUsxdgpOQTc4eklnckJvT296Y25hTVNZQTZGY0d3S0JpUGo1YlUvbG1EdU52S21rZ1p6N0h2ZEVWRkZnSUZkTGx5R1NKClVHTXJIOUNIak5vQitHc0lucnN5aVp1alhZNnI5WVR2SUxIME1qVG9NcEVRQ0NxYlErZkoxRFhzV0h5aTl0dTEKZjFET3QzaE9paFRBU2tCVHMxWStuMUtUQW5aMjEzV1Z3dUxTOTNUYlpzRTJGSHp2Y3ExTWt2NzlkZmRFNjgrbAowalRMdHR2YmJkWFJjVjI1L053c216QjNqWWNxSFVrVEttK2p3WnNMUnB3b2pxR1FUYkl6U3QwdFNnTTRjQUU1CjJSa2hXSCtSNEcrYWRTNjZ4TkpOK0FpQlNFZXVOc2duUnprS3ZYWitHNTJNVEJpOERnNEZVSVBTWis4OFJCMjgKbVhWN3BISUpjaEhwMVE9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==
                            extensions:
                            - extension:
                                last-update: Sun, 05 Apr 2026 19:22:07 PDT
                                provider: minikube.sigs.k8s.io
                                version: v1.38.0
                            name: cluster_info
                            server: https://127.0.0.1:54163
                        name: minikube
                        contexts:
                        - context:
                            cluster: minikube
                            user: minikube
                        name: minikube
                        current-context: minikube
                        kind: Config
                        users:
                        - name: minikube
                        user:
                            client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURJVENDQWdtZ0F3SUJBZ0lCQWpBTkJna3Foa2lHOXcwQkFRc0ZBREFWTVJNd0VRWURWUVFERXdwdGFXNXAKYTNWaVpVTkJNQjRYRFRJMk1ESXhNVEF5TURZeU1Gb1hEVEk1TURJeE1UQXlNRFl5TUZvd01URVhNQlVHQTFVRQpDaE1PYzNsemRHVnRPbTFoYzNSbGNuTXhGakFVQmdOVkJBTVREVzFwYm1scmRXSmxMWFZ6WlhJd2dnRWlNQTBHCkNTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFEQ2hwLzI1R2toWXVjajVTTkI2d1lWem9sTVVvOWEKWXJUREVnLzduQ1dCbDQxUkMza0RCWjlaN0N2TnFGajl4OTQrZ1JMRFVlMzhKNEVoWUsxQWVUM1FHWFg3cVVvWQpSWStqV1BQdXRzamFBS3NKaXQ5Y1RtMVhsaDlPV01KTXB2a1FIK3pLVjd5RnVyemNJU25pTURIMzhWSmNVeHV6CjdTdkhURTZ6bkRsZGN5SW9vbW9MY1NrSEJ0RlMrSlZlL1FRUTZoU25NOHZ0ZWM2dG93eDNJbDd1dFBCcWJSZWkKMXN4WWxRRjdnY2NqTlN1MVNMTkNueDhnb3dpd0cwUC9UQkJ5LzdIMUY1VC9BYTdBWStsL0dpK0lNUXQ3bEg0cQpMTDBOdEF0NXQ3ZlVJM0x3TURib1d2R3gzZU8yT2p6bm5kNUk4WGV1Y0lKWHJQNzBsSjhnV3JnWkFnTUJBQUdqCllEQmVNQTRHQTFVZER3RUIvd1FFQXdJRm9EQWRCZ05WSFNVRUZqQVVCZ2dyQmdFRkJRY0RBUVlJS3dZQkJRVUgKQXdJd0RBWURWUjBUQVFIL0JBSXdBREFmQmdOVkhTTUVHREFXZ0JTZzBrOFlRaUhmM2l1ZzFaa2dXU2VpU2V4dQorekFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBb1ZIbWM1dmtqRUZ6YzJ2TlVuUFZSN2xlb1ZpbDZsVGVUOGErCm1yeGV2TXAybzVVbDFUREpJMEE0MCtXVTFKVlh5VU85c1JSTy9ndmlKV3k4bk9vUitmbG5sUlZacGw3SmdXS00KbFdCWnlGbURxdUJWNTZyRWVkb0tLcHlOaW1JTVVuaDBxMEY4U0pHNFozbzV3TStsWnZYOXJqaFpWTWlXL2t0UApGNWNxa1kwRjZXUlF4aGJvLzZWNmNxT1YyZ1Q1dVZaV3JqL0hTOUFzZVkrUWl6bGxHbkZ1RWh4Q0lhb3BERXF6CmxYaU1xSTdLb0ZqZytXYkY2bUNjWGdEankyNHZ6ZVNia1VkeEgzLzdYQ3M3U0VEUktFQlY5VEJ5OVdrcDNMdWEKb2ZYeHVscitJT0V0YzBHSThTY1VWQzk1ekVXZTRZSC9ORml1bkhEK09jMGdIdEs2VWc9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==
                            client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFcEFJQkFBS0NBUUVBd29hZjl1UnBJV0xuSStValFlc0dGYzZKVEZLUFdtSzB3eElQKzV3bGdaZU5VUXQ1CkF3V2ZXZXdyemFoWS9jZmVQb0VTdzFIdC9DZUJJV0N0UUhrOTBCbDErNmxLR0VXUG8xano3cmJJMmdDckNZcmYKWEU1dFY1WWZUbGpDVEtiNUVCL3N5bGU4aGJxODNDRXA0akF4OS9GU1hGTWJzKzByeDB4T3M1dzVYWE1pS0tKcQpDM0VwQndiUlV2aVZYdjBFRU9vVXB6UEw3WG5PcmFNTWR5SmU3clR3YW0wWG90Yk1XSlVCZTRISEl6VXJ0VWl6ClFwOGZJS01Jc0J0RC8wd1Fjdit4OVJlVS93R3V3R1BwZnhvdmlERUxlNVIrS2l5OURiUUxlYmUzMUNOeThEQTIKNkZyeHNkM2p0am84NTUzZVNQRjNybkNDVjZ6KzlKU2ZJRnE0R1FJREFRQUJBb0lCQUJCZnZhSk9HcTFWUW1pSwpscHVyV1ZGSGw5WUZVd3pFSnp3T1Rxc2F1eXQ3NHNqU0l1Y0d0NkdkbUJoUkZlQ1N6Tm5OQ3BQSFZ6VjA2OUV2CjdwVnhQeXMvb1dkRUdqa056ZWZ0aW1ickd1QUMwMkxUdmpacVlaalFTYVZTSWxUS2IwZVVzRjFkNGtBTmRtMC8KRzJQdk01MlB3aU9FV1Y0ZFZpU0ovMHZ1R0FRT0VkMXViTlozWjJlaHdhTkgzYTNjajBHdU9UcC9tRFZzLy9nZgpPRDZtTjFsVGlaZG02QzZVa2hPN3REUGRnMTI4anhWanFaZVZ4a1B1L0s5dExvRzc3ZUJOMlJ3YTNjWStDdndzCm5MSTErckV2VWo5Q3h6SXVvaFNKUklsY052ZlV4a29jWWFLVE1RMi9pNEM3bUl6NEgwYVMza1pxVUd0a05IS20KWG11djg4RUNnWUVBNFp6aDFoalNRZVAxVXVWdnhtRVQyTDhMQVk3WjlSdlBzY0J4WTFLTGVSOUNQem8rRFNpdwpyVjdMVHhTWlhSYVUzSG1iNWdGeXhwVnMycnFnbDBEdHF6K1dNaCtJYnllMVRXYUtVMWtaTHNud0sxQ05sU1JrCkRXNm90NmNwQWVSTElKQXFWekFYeHhrWDRyZXlVa09iS2VTd21Fam1Ec0xHRHRkRWNQWWh2R2tDZ1lFQTNMbmQKMlFkSWtlNzRTR0xXYk1NeUl6WDFmamF2aE1XVzFna05XcUV4SnZDRWlnWXZxZHdsckQ3VHl4Qk54eWJmVm1lLwo0Q2RVeGN3eEhhQy9ZZDcreXhrYzBTblBrTFdqblFyaW5sanROeFBIakxuUlhBVGpEa2c1cVNKcE12L2o2dkRmClFLUW5QMEFXS0xTQ0ppZFZDb2tqd243ZjNxMTkyOFdwQzRVamFERUNnWUVBNEVVdUxjQlF5aFVMMmhLZkVPbVIKYkFWRXNKRExVeDhKVUI0SDJQN0dER29wVldiVkpnbUx6MXVLNkpxR2RZV3NCcHFRZ1l4eEJyeWxENjB6VkFmRAorbFprUElFaUE3VEtRaDJyWlgwTlRuaUkyTlhqV0Ixcm8vcWJscXlCVkJNWEoxQ0g5bEdsWVZJdGJ6N0I4WXFvCjVIVWpvczNjZTFIY3hnWHhVQVVydGZrQ2dZQWxIa2lWYjZrZmlXMU5Wdm15THAwbTJMTWc5M2RLdjZPZStNUzcKSWZKUEZ4RmkyS2w1U2lFM3R4VU15QUFjWm9nV1Vyb3NxdENSdHNYbnNwbWNqdENRUFBmZ29NUmNGSCtnTUMxdAo3WXh1djYvR0ZaV0VnUG5oOC9sbVhQZ044SVJXaFEwMkpLVEkrVEVBeFdKQm9rbWx6T3dya0FSN3dQY3lWeW9YCld0dGFjUUtCZ1FEUkZlNFhIRXVLNVNadWt1cDJlK1pzN2NvN2x3WlE3bG12Q08wdzV5UFo3MWVDSXdwWHF2S2wKS1czRjgvdlk3THJVUzg0cmFGRm5wUVp3M1FHdW5yMmhGSEp5cVlPL083ZnJvRXkrNXpvK1hweVJHajJpRCs4KwpNK0tTZ1UzN0dBS05kL0lqZEgvUEd1M0c2Mkp2b0FkUUFUTWlNT2xjZ2xsU2t3bW1ydm0za0E9PQotLS0tLUVORCBSU0EgUFJJVkFURSBLRVktLS0tLQo=

                        # 3. Configuramos el entorno
                        export KUBECONFIG="/var/jenkins_home/.kube/config"
                        export no_proxy="localhost,127.0.0.1,host.docker.internal"
                        export NO_PROXY="localhost,127.0.0.1,host.docker.internal"
                        unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY

                        echo "Deploying SnapCart to Kubernetes..."
                        
                        # 4. Aplicamos los cambios saltando la validación TLS por el cambio de IP/Host
                        kubectl apply -f ${K8S_DIR}/namespace.yaml --insecure-skip-tls-verify=true
                        kubectl apply -f ${K8S_DIR}/deployment.yaml --insecure-skip-tls-verify=true
                        kubectl apply -f ${K8S_DIR}/service.yaml --insecure-skip-tls-verify=true
                        
                        kubectl rollout status deployment/snapcart-deployment -n ${NAMESPACE} --timeout=120s --insecure-skip-tls-verify=true
                    """
            }
        }
    }
}
