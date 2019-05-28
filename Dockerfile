FROM alpine:3.2
ADD html /html
ADD location-web /location-web
WORKDIR /
ENTRYPOINT [ "/location-web" ]
