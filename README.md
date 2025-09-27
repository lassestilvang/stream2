# My Movie/TV App

A modern, professional web application for tracking watched movies and TV shows, and managing a watchlist. Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand, Neon PostgreSQL, Drizzle ORM, Upstash Redis, Jest, and Playwright.

## Features

*   **Search:** Discover movies and TV shows using the TMDB API.
*   **Watched Content:** Track what you've watched with date, rating, and notes.
*   **Watchlist:** Maintain a list of content you want to watch.
*   **Authentication:** Secure user authentication using NextAuth.js with Drizzle Adapter for Neon and Upstash Redis for sessions.
*   **Responsive Design:** Optimized for various screen sizes with light/dark theme support.
*   **Visual Feedback:** Loading states, error handling, and animations.

## Tech Stack

*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, shadcn/ui
*   **State Management:** Zustand
*   **Database:** Neon PostgreSQL
*   **ORM:** Drizzle ORM
*   **Session Management:** Upstash Redis
*   **Package Manager:** pnpm
*   **Testing:** Jest (Unit), Playwright (E2E)
*   **Deployment:** Vercel

## Getting Started

Follow these instructions to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/my-movie-app.git
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables:

```
# TMDB API Key
NEXT_PUBLIC_TMDB_API_KEY=YOUR_TMDB_API_KEY

# Neon PostgreSQL Database URL
NEON_DATABASE_URL=YOUR_NEON_DATABASE_URL

# NextAuth.js Secret
AUTH_SECRET=YOUR_AUTH_SECRET
AUTH_URL=http://localhost:3000

# GitHub OAuth
GITHUB_ID=YOUR_GITHUB_ID
GITHUB_SECRET=YOUR_GITHUB_SECRET

# Upstash Redis for NextAuth.js sessions
UPSTASH_REDIS_REST_URL=YOUR_UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN=YOUR_UPSTASH_REDIS_REST_TOKEN
```

*   **`NEXT_PUBLIC_TMDB_API_KEY`**: Get your API key from [TMDB](https://www.themoviedb.org/documentation/api).
*   **`NEON_DATABASE_URL`**: Your connection string for the Neon PostgreSQL database.
*   **`AUTH_SECRET`**: A random string used to sign and encrypt the session cookie. You can generate one using `openssl rand -base64 32`.
*   **`AUTH_URL`**: The URL of your application (e.g., `http://localhost:3000`).
*   **`GITHUB_ID`**, **`GITHUB_SECRET`**: Create a new OAuth application on [GitHub](https://github.com/settings/applications/new). Set the callback URL to `http://localhost:3000/api/auth/callback/github`.
*   **`UPSTASH_REDIS_REST_URL`**, **`UPSTASH_REDIS_REST_TOKEN`**: Get these from your [Upstash Redis](https://upstash.com/) dashboard.

### 4. Database Setup

Run Drizzle migrations to create the necessary tables in your Neon database:

```bash
pnpm run db:push
```

### 5. Run the Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### Unit Tests (Jest)

```bash
pnpm run test
pnpm run test:watch # Run tests in watch mode
```

### End-to-End Tests (Playwright)

```bash
pnpm run test:e2e
pnpm run test:e2e:ui # Run tests with Playwright UI
```

## Deployment

This project is configured for deployment on [Vercel](https://vercel.com/). Ensure your environment variables are configured in your Vercel project settings.
