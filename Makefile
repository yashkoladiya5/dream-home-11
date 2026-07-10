.PHONY: help backend admin flutter test db

help:
	@echo "Dream Home 11 Commands"
	@echo "  make backend   — Start backend dev server"
	@echo "  make admin     — Start admin dev server"
	@echo "  make flutter   — Start Flutter app"
	@echo "  make test      — Run all tests"
	@echo "  make db        — Start PostgreSQL + Redis"

backend:
	cd backend && npm run start:dev

admin:
	cd admin && npm run dev

flutter:
	flutter run

test:
	cd backend && npm test -- --no-coverage
	cd admin && npm test
	flutter test --reporter expanded

db:
	docker compose up -d postgres redis
