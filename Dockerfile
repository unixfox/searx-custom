FROM alpine:3.17

WORKDIR /usr/local/searx

COPY . /usr/local/searx

RUN set -xe \
    && apk upgrade --no-cache \
    && apk add --no-cache -t build-dependencies \
       build-base \
       py3-setuptools \
       python3-dev \
       libffi-dev \
       libxslt-dev \
       libxml2-dev \
       openssl-dev \
    && apk add --no-cache \
       ca-certificates \
       python3 \
       py3-pip \
       libxml2 \
       libxslt \
       openssl \
    && sed -i s/fasttext-wheel/fasttext/ requirements.txt \
    && pip3 install --no-cache -r requirements.txt \
    && apk del --purge build-dependencies \
    && rm -f /var/cache/apk/* /tmp/* \
    && rm -rf /root/.cache \
    && find /usr/lib/python*/ -name '*.pyc' -delete

EXPOSE 8888

ENV BIND_ADDRESS=0.0.0.0

CMD [ "python3", "-m", "searx.webapp" ]
