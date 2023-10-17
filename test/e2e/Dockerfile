FROM testcafe/testcafe:2.1.0

USER root

RUN npm install -g yarn && \
    sed --in-place --regexp-extended "s/^node /yarn node /" /opt/testcafe/docker/testcafe-docker.sh

USER user