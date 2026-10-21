FROM php:8.3-apache

# headers + AllowOverride: para que Apache lea app/.htaccess (cache del HTML)
RUN a2enmod rewrite headers \
    && sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf
RUN docker-php-ext-install pdo_mysql
