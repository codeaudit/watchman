FROM python:2.7

ENV TERM=xterm

# docker build-time args
ARG SERVICE
ARG MAIN=main.py

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  vim \
  less \
  nano

RUN apt-get autoremove -y

COPY $SERVICE/requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY $SERVICE .
# create consistent top-level filename
COPY $SERVICE/$MAIN docker_main.py
# match project dir structure to satisfy imports
COPY util /usr/src/util

ENTRYPOINT ["python", "-u", "docker_main.py"]
