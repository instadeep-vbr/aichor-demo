FROM python:3.9.7-slim

COPY build/requirements.txt .
RUN pip install -r requirements.txt
RUN sleep 3100
WORKDIR /app
COPY ./src ./src
COPY main.py .
