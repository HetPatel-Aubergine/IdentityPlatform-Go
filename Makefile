.PHONY: all

all: up

up:
	go run .

ui:
	cd frontend && npm run dev
