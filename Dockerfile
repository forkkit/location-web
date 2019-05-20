FROM alpine:3.2
ADD html /html
ADD routes /routes
ADD location-web /location-web
WORKDIR /
ENTRYPOINT [ "/location-web" ]
