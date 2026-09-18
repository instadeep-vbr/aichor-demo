FROM alpine/curl AS vscode-installer

RUN mkdir /aichor
RUN apk add --no-cache bash
RUN curl -Lk 'https://code.visualstudio.com/sha/download?build=stable&os=cli-alpine-x64' --output /aichor/vscode_cli.tar.gz
RUN tar -xf /aichor/vscode_cli.tar.gz -C /aichor
RUN wget https://aka.ms/TunnelsCliDownload/linux-x64
RUN mv linux-x64 /aichor/devtunnel
RUN ./DevTunnelCliInstall

FROM python:3.9.7-slim

COPY --from=vscode-installer /aichor /aichor
COPY build/requirements.txt .
COPY --from=vscode-installer /bin/devtunnel /bin/devtunnel
RUN pip install -r requirements.txt
WORKDIR /app
COPY ./src ./src
COPY main.py .
