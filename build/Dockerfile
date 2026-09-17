FROM alpine/curl AS vscode-installer

RUN mkdir /aichor
RUN curl -Lk 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64' --output /aichor/vscode_cli.tar.gz
RUN tar -xf /aichor/vscode_cli.tar.gz -C /aichor

FROM python:3.9.7-slim

COPY --from=vscode-installer /aichor /aichor
COPY build/requirements.txt .
RUN pip install -r requirements.txt
WORKDIR /app
COPY ./src ./src
COPY main.py .
