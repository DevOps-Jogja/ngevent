# Ngevent

Event management application built using Next.js.

## Prerequisites

Make sure you have installed:
- Node.js (latest version recommended)
- npm (or yarn/pnpm)

## How to Run

1.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Configure Environment Variables**:
    Copy the `.env.local.example` file to `.env.local`:
    ```bash
    cp .env.local.example .env.local
    ```
    Then open the `.env.local` file and fill in the required variables:
    - **Supabase**: URL and Keys for the database.
    - **Resend**: API Key for email sending.
    - **Upstash Redis & QStash**: For caching and background jobs.
    - **Cloudflare R2**: For file storage (images, etc.).
    - **Turnstile**: For captcha protection.

3.  **Run the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

    The application will run at [http://localhost:3000](http://localhost:3000).

## Build for Production

To create a production build:

```bash
npm run build
npm start
```
