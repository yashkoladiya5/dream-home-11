FROM fluent/fluentd:v1.16-debian-1

USER root

RUN fluent-gem install \
  fluent-plugin-s3 \
  fluent-plugin-kubernetes_metadata_filter \
  fluent-plugin-elasticsearch

COPY fluentd.conf /fluentd/etc/fluentd.conf

ENV FLUENTD_CONF="fluentd.conf"

RUN mkdir -p /var/log/fluentd-buffers && \
    chown -R fluent:fluent /var/log/fluentd-buffers

USER fluent

EXPOSE 24224 24224/udp
