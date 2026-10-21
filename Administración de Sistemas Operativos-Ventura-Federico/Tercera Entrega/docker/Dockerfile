# Imagen de la aplicación web del SGDM: Apache + PHP 8.3
FROM php:8.3-apache

# Extensión para conectarse a MariaDB, configuración de producción de PHP y
# .htaccess habilitado (app/.htaccess: el HTML no queda viejo en la cache)
RUN docker-php-ext-install pdo_mysql \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && echo "expose_php = Off" > "$PHP_INI_DIR/conf.d/sgdm.ini" \
    && printf "ServerTokens Prod\nServerSignature Off\n" > /etc/apache2/conf-enabled/sgdm.conf \
    && a2enmod headers \
    && sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# El código va dentro de la imagen (no se monta desde el servidor)
COPY app/ /var/www/html/
RUN chown -R root:www-data /var/www/html \
    && chmod -R u=rwX,g=rX,o= /var/www/html

# Docker marca el contenedor como "unhealthy" si Apache deja de responder
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s --start-interval=3s \
    CMD curl -fs http://localhost/ >/dev/null || exit 1
