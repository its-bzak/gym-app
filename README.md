# Gym App

Gym App is a mobile fitness tracker built with Expo, React Native, and TypeScript. The main application lives in [gym-tracker](gym-tracker) and focuses on helping users manage workouts, bodyweight goals, nutrition targets, and long-term training progress from a single app.

## Project Overview

The app currently includes:

- workout flows for routines, exercise tracking, and active sessions
- progress views for weight trends, goal pacing, and lifetime metrics
- nutrition target management for calories and macros
- profile and achievement surfaces
- light and dark themed redesign work built on a shared design system
- Supabase integration with mock/local fallbacks for development

## Tech Stack

- Expo Router
- React Native
- TypeScript
- NativeWind
- Supabase
- react-native-svg

## Repository Layout

- [gym-tracker](gym-tracker): main Expo application
- [gym-tracker/app](gym-tracker/app): route-based screens
- [gym-tracker/components](gym-tracker/components): shared UI and feature components
- [gym-tracker/design](gym-tracker/design): tokens, themes, and redesigned dashboard components
- [gym-tracker/services](gym-tracker/services): app data and persistence services
- [gym-tracker/mock](gym-tracker/mock): development fallback data

## Getting Started

From [gym-tracker](gym-tracker):

```bash
npm install
npm start
```

Useful scripts:

- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm test`

See [gym-tracker/README.md](gym-tracker/README.md) for app-specific details.
