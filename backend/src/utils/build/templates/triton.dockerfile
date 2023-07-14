FROM continuumio/miniconda3:4.12.0 AS env-builder
SHELL ["/bin/bash", "-c"]

ARG TRITON_ENV_NAME="triton-python-env" \
    TRITON_ENV_TARBALL="./envs/triton-python-env.tar.gz"

RUN conda config --add channels conda-forge && \
    conda install conda-pack mamba

# The `[]` character range will ensure that Docker doesn't complain if the
# files don't exist:
# https://stackoverflow.com/a/65138098/5015573
COPY \
    ./environment.ym[l] \
    ./environment.yam[l] \
    ./conda.ym[l] \
    ./conda.yam[l] \
    .
RUN mkdir $(dirname $TRITON_ENV_TARBALL); \
    for envFile in environment.yml environment.yaml conda.yml conda.yaml; do \
        if [[ -f $envFile ]]; then \
            mamba env create                 --name $TRITON_ENV_NAME \
                --file $envFile; \
            conda-pack --ignore-missing-files                 -n $TRITON_ENV_NAME \
                -o $TRITON_ENV_TARBALL; \
        fi \
    done; \
    chmod -R 776 $(dirname $TRITON_ENV_TARBALL)

FROM nvcr.io/nvidia/tritonserver:23.04-py3 as final
SHELL ["/bin/bash", "-c"]

WORKDIR /models

RUN groupadd -g 1001 -f triton; \
    useradd -u 1001 -g 1001 -s /bin/bash -m triton; \
    chmod 775 /models; \
    chown -R 1001:0 /models

COPY --chown=1001:0 ./models .

#TODO Add templating into the path name for the enviroment.  Each model under the `models` folder will have it's own seperately named folder. 
COPY \
    --chown=1001:0 \
    --from=env-builder \
    /envs/triton-custom-env.tar.g[z] \
    /models/<model folder>/triton-python-env.tar.gz

USER triton
