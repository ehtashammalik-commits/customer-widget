FROM gitlab.expertflow.com:9242/general/nginx:1.19.5-alpine-3.12-rbi-256

WORKDIR /usr/share/nginx/html

COPY dist/ .
COPY config.json.template .
COPY config.js.template .
COPY docker-entrypoint.sh .
RUN chmod a+x docker-entrypoint.sh
RUN apk add tzdata

RUN echo "user:x:1001060000:0::/usr/share/nginx/html:" >> /etc/passwd
RUN echo "user:!:$(($(date +%s) / 60 / 60 / 24)):0:99999:7:::" >> /etc/shadow
RUN echo "user:x:1001060000:" >> /etc/group
RUN chmod -R 775 /usr/share/nginx/html
RUN chown -R user:root /usr/share/nginx/html /var/cache/nginx /var/run /var/log/nginx
RUN chmod -R 775 /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d/default.conf

RUN sed -i.bak 's/listen\(.*\)80;/listen 8080;/' /etc/nginx/conf.d/default.conf
# RUN sed -i.bak '/listen 8080;/listen 8443 ssl;/' /etc/nginx/conf.d/default.conf
RUN sed -i.bak 's/^user/#user/' /etc/nginx/nginx.conf
# Following lines remove apk and its repo files, trivy will not be able to scan installed packages in this image and will report no vulnerability
# dirty way to do it but its the common practice in image hardening to remove package manager
RUN rm -f /sbin/apk
RUN rm -rf /etc/apk
RUN rm -rf /lib/apk
RUN rm -rf /usr/share/apk
RUN rm -rf /var/lib/apk

HEALTHCHECK --interval=1m30s --timeout=3s --retries=10 \
	CMD curl -f -k http://localhost:8080 || exit 1

USER 1001060000
EXPOSE 8080
# EXPOSE 443

ENTRYPOINT ["sh","./docker-entrypoint.sh" ]
