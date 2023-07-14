FROM seldonio/seldon-core-s2i-python3:1.15.1
LABEL "io.openshift.s2i.build.image"="seldonio/seldon-core-s2i-python3:1.15.1" \
      "io.openshift.s2i.build.source-location"="<folder_name>" \
      "io.openshift.s2i.scripts-url"="image:///s2i/bin"
ENV MODEL_NAME="<model name>" \
    SERVICE_TYPE="MODEL" \
    PERSISTENCE="1" \
    TRANSFORMERS_CACHE="/microservice/cache" \
    API_TYPE="REST" \
    PIP_NO_CACHE_DIR="off" \
    INCLUDE_METRICS_IN_CLIENT_RESPONSE="false" \ 
    PREDICTIVE_UNIT_HTTP_SERVICE_PORT="4000"

USER root
# Copying in source code
COPY upload/src /tmp/src
# Change file ownership to the assemble user. Builder image must support chown command.
RUN chown -R root:0 /tmp/src
# Assemble script sourced from builder image based on user input or image metadata.
# If this file does not exist in the image, the build will fail.
RUN /s2i/bin/assemble
# Run script sourced from builder image based on user input or image metadata.
# If this file does not exist in the image, the build will fail.
CMD /s2i/bin/run