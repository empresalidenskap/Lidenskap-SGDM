#!/bin/bash
set -Eeuo pipefail

LOG="/var/log/sgdm_docker.log"
DIR_DOCKER="/opt/sgdm/docker"
DIR_SGDM="/opt/sgdm"
DOCROOT="/var/www/html"
DIR_RESPALDO="/var/backups/sgdm/docker"
PUERTO=8080

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG"
}

trap 'log "ERROR en la línea $LINENO: $BASH_COMMAND"' ERR

require_root() {
    if [[ $EUID -ne 0 ]]; then
        echo "Error: este comando debe ejecutarse como root (usar sudo)." >&2
        exit 1
    fi
}

compose() {
    docker compose -f "$DIR_DOCKER/docker-compose.yml" "$@"
}

instalar() {
    dnf install -y dnf-plugins-core >/dev/null
    if [[ ! -f /etc/yum.repos.d/docker-ce.repo ]]; then
        dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    fi
    dnf install -y --allowerasing docker-ce docker-ce-cli containerd.io docker-compose-plugin >/dev/null

    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json <<'EOF'
{
  "selinux-enabled": true,
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
EOF
    systemctl enable docker >/dev/null 2>&1
    systemctl restart docker

    if systemctl is-active --quiet firewalld; then
        firewall-cmd --permanent --zone=public --add-port=$PUERTO/tcp >/dev/null
        firewall-cmd --reload >/dev/null
    fi
    log "Docker instalado: $(docker --version)."
}

preparar() {
    [[ -f "$DIR_DOCKER/docker-compose.yml" ]] || { log "ERROR: falta $DIR_DOCKER/docker-compose.yml (reinstalar con instalar_sgdm.sh --con-docker)."; exit 1; }
    mkdir -p "$DIR_DOCKER/app"
    install -d -m 755 "$DIR_DOCKER/db"
    rsync -a --delete "$DOCROOT/" "$DIR_DOCKER/app/"
    install -m 644 "$DIR_SGDM/01-schema.sql" "$DIR_SGDM/03-seed-demo.sql" "$DIR_DOCKER/db/"
    install -m 755 "$DIR_DOCKER/02-users.sh" "$DIR_DOCKER/db/"

    if [[ ! -f "$DIR_DOCKER/.env" ]]; then
        (umask 077; cat > "$DIR_DOCKER/.env" <<EOF
DB_NAME=sgdm
DB_ROOT_PASSWORD=$(openssl rand -hex 16)
DB_ADMIN_USER=sgdm_admin
DB_ADMIN_PASSWORD=$(openssl rand -hex 16)
DB_APP_USER=sgdm_app
DB_APP_PASSWORD=$(openssl rand -hex 16)
DB_CONSULTA_USER=sgdm_consulta
DB_CONSULTA_PASSWORD=$(openssl rand -hex 16)
EOF
        )
        log "Contraseñas generadas en $DIR_DOCKER/.env (solo root)."
    fi
}

levantar() {
    preparar
    log "Construyendo la imagen y levantando los contenedores..."
    compose up -d --build

    local i
    for i in $(seq 1 60); do
        if [[ "$(docker inspect -f '{{.State.Health.Status}}' sgdm-web-1 2>/dev/null)" == "healthy" ]]; then
            log "SGDM en Docker funcionando: http://$(hostname -I | awk '{print $1}'):$PUERTO"
            return 0
        fi
        sleep 3
    done
    log "ERROR: los contenedores no quedaron 'healthy' (ver: sudo docker_sgdm.sh logs)."
    exit 1
}

bajar() {
    compose down
    log "Contenedores detenidos (los datos siguen en el volumen sgdm_db_data)."
}

estado() {
    echo "---- Contenedores ----"
    compose ps
    echo ""
    echo "---- Uso de recursos ----"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(compose ps -q)
    echo ""
    echo "---- Redes ----"
    docker network ls --filter name=sgdm
    echo ""
    echo "---- Volúmenes ----"
    docker volume ls --filter name=sgdm
    echo ""
    echo "---- Prueba HTTP ----"
    echo "http://localhost:$PUERTO -> $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$PUERTO/ || true)"
}

logs() {
    compose logs --tail 50
}

respaldo() {
    mkdir -p "$DIR_RESPALDO"
    chmod 700 "$DIR_RESPALDO"
    local archivo
    archivo="$DIR_RESPALDO/sgdm_docker_$(date +%Y%m%d_%H%M%S).sql.gz"
    compose exec -T db sh -c 'mariadb-dump -u root -p"$MARIADB_ROOT_PASSWORD" --single-transaction "$MARIADB_DATABASE"' | gzip > "$archivo"
    chmod 600 "$archivo"
    log "Respaldo de la base en Docker: $archivo"
}

uso() {
    cat <<EOF
Uso: sudo $0 <accion>

Acciones:
  instalar   Instala Docker CE y abre el puerto $PUERTO en el firewall
  levantar   Construye la imagen y levanta web + db (http://IP:$PUERTO)
  bajar      Detiene los contenedores (los datos se conservan)
  estado     Contenedores, uso de recursos, redes y volúmenes
  logs       Últimas líneas de los logs de los contenedores
  respaldo   Respaldo de la base del contenedor en $DIR_RESPALDO
EOF
}

main() {
    local accion=${1:-}
    case "$accion" in
        instalar|levantar|bajar|estado|logs|respaldo)
            require_root; "$accion" ;;
        *)  uso; exit 1 ;;
    esac
}

main "$@"
