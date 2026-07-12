# Lights

A React Native (Expo) shell for Home Assistant that lets you view and organize your smart home entities from a clean, mobile-first interface.

## What it does

- **Browse entities** — read and interact with your Home Assistant entities (lights, switches, sensors, etc.)
- **Organize your layout** — arrange entities into a custom layout that makes sense for your home
- **Per-user configuration** — layout and preferences are stored directly in your Home Assistant instance, so your setup follows you across devices
- **Home Assistant OAuth login** — authentication is handled via Home Assistant's built-in OAuth flow, no separate account needed

## How it works

Login is done through Home Assistant's OAuth2 authorization flow. Once authenticated, the app communicates with your Home Assistant instance to fetch your entities and persist any layout configuration you create. Everything is tied to your own HA instance — no third-party cloud involved.

## Tech stack

- [Expo](https://expo.dev) v54 (React Native)
- Expo Router for file-based navigation
- TypeScript
- React Native Reanimated for animations

## Getting started

```bash
npm install
npx expo start
```

Open the app in [Expo Go](https://expo.dev/go) or a simulator, then log in with your Home Assistant instance URL and credentials.
