# Gym Tracker

Gym Tracker is an Expo Router application for tracking training, nutrition, and bodyweight progress. It combines workout flows, progress analytics, and goal-setting tools in a mobile-first React Native app.

## Features

- dashboard and tab-based navigation for workout, nutrition, performance, and profile flows
- active workout state with routine and exercise support
- bodyweight goal planning with pace controls and projected completion dates
- performance analytics including weekly average weight trends and lifetime training metrics
- nutrition target editing for calories, protein, carbs, and fats
- light and dark theme support through a shared design token system
- Supabase-backed data access with mock fallback data for development and offline-style testing

## Stack

- Expo 54
- Expo Router
- React Native 0.81
- React 19
- TypeScript
- NativeWind
- Supabase
- react-native-svg
- Jest

## App Structure

- [app](app): route-based screens and navigation layouts
- [components](components): reusable UI and feature components
- [design](design): tokens, themes, primitives, and redesigned dashboard surfaces
- [context](context): active workout and shared library state
- [services](services): data-fetching and persistence logic
- [mock](mock): local fallback data and tests
- [utils](utils): formatting, unit conversion, and progress helpers

## Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

Additional scripts:

- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run lint`
- `npm test`

## Current Notes

- The app uses file-based routing through Expo Router.
- Supabase is configured for Expo with AsyncStorage-backed session persistence.
- Mock data remains available so core flows can be exercised without a fully connected backend.
- The redesigned performance and dashboard experience is built on the shared `design/` system.
