FROM alpine/curl AS vscode-installer

RUN mkdir /aichor
RUN apk add --no-cache bash
RUN curl -Lk 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64' --output /aichor/vscode_cli.tar.gz
RUN tar -xf /aichor/vscode_cli.tar.gz -C /aichor
RUN wget https://aka.ms/TunnelsCliDownload/linux-x64
RUN mv linux-x64 /aichor/devtunnel

FROM python:3.9-slim-bookworm

COPY --from=vscode-installer /aichor /aichor
COPY build/vscode-audit-extension /root/.vscode-server/extensions/aichor.aichor-session-audit-0.0.1
COPY build/requirements.txt .
RUN pip install -r requirements.txt
RUN apt-get update
RUN apt-get install -y libicu-dev
WORKDIR /app
COPY ./src ./src
COPY main.py .
