# Offline-First Distributed Sync Engine

This repository serves two purposes.
- It will serve as the Offline-First Distributed Sync Engine displayed on my resume.
- It will function as an exercise and fitness tracking application for real world users to use and enjoy.

I will also be using this as an opportunity to strengthen my engineering practices.

## Backend database setup

The backend connects to PostgreSQL database `gymapp` on `localhost:5432` by default.
From the `backend` directory, copy `.env.example` to `.env` and set `DB_USERNAME`
and `DB_PASSWORD` to your PostgreSQL credentials. `DB_URL` can be changed if your
PostgreSQL server uses a different host or port. The `.env` file is ignored by Git.
Do not wrap values in quotes; they are read as part of the value.

Start the backend from the `backend` directory with `.\gradlew.bat bootRun` on
Windows or `./gradlew bootRun` on macOS/Linux. While the app is running, Gradle
stays at `80% EXECUTING > :bootRun`; this is expected. Stop it with Ctrl+C.