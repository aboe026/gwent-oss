FROM testcafe/testcafe:3.7.2

USER root

RUN npm install -g corepack && \
    corepack enable && \
    sed --in-place --regexp-extended "s/^node /yarn node /" /opt/testcafe/docker/testcafe-docker.sh

USER user