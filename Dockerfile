FROM alpine:3.2
ADD html /html
ADD routes /routes
ADD geo-web /geo-web
WORKDIR /
ENTRYPOINT [ "/geo-web" ]
