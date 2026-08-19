.PHONY: dev backend backend-clean test test-r frontend install fmt

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

fmt:
	cd frontend && npm run format