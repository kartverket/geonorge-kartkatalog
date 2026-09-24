.PHONY: dev backend backend-clean test test-r frontend install fmt fmt-backend lint-backend

backend:
	cd backend && ./gradlew run

backend-clean:
	cd backend && ./gradlew clean run

test:
	cd backend && ./gradlew test

test-r:
	cd backend && ./gradlew test --rerun

frontend:
	cd frontend && npm run dev

install:
	cd frontend && npm install

ci-frontend:
	cd frontend && npm ci

fmt-frontend:
	cd frontend && npm run format
	
lint-frontend:
	cd frontend && npm run lint

verify-frontend:
	cd frontend && npm run ts-check && npm run next-compile

build-frontend:
	cd frontend && npm run build

fmt-backend:
	cd backend && ./gradlew ktlintFormat

lint-backend:
	cd backend && ./gradlew ktlintCheck