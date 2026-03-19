# Task Management Backend API

A robust REST API built with NestJS for task management, featuring authentication, task CRUD operations, and more.

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Task Management Backend API

A robust REST API built with NestJS for task management, featuring authentication, task CRUD operations, and more.

## Features

- **Authentication**: JWT-based auth with access and refresh tokens
- **Task Management**: Full CRUD operations with filtering, searching, and pagination
- **Database**: Prisma ORM with SQLite (easily switchable to PostgreSQL/MySQL)
- **Validation**: Input validation with class-validator
- **Security**: Password hashing, CORS, rate limiting ready
- **Documentation**: RESTful API endpoints

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up database**:
   ```bash
   npx prisma db push
   ```

3. **Start development server**:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3001`

## Environment Variables

Create a `.env` file in the root of the backend directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="refresh-secret-key-change-in-production"
PORT=3001
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (requires auth)

### Tasks (All require authentication)
- `GET /tasks` - Get tasks with pagination, filtering, searching
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get specific task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `GET /tasks/:id/toggle` - Toggle task status

## Scripts

- `npm run start` - Start production server
- `npm run start:dev` - Start development server with hot reload
- `npm run start:debug` - Start debug mode
- `npm run start:prod` - Start production server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run test:cov` - Run tests with coverage

## Database

This project uses Prisma with SQLite for development. To switch to another database:

1. Update `DATABASE_URL` in `.env`
2. Update `datasource` in `prisma/schema.prisma`
3. Run `npx prisma db push`

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# With coverage
npm run test:cov
```

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start production server:
   ```bash
   npm run start:prod
   ```

## Technologies

- **NestJS** - Node.js framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Class Validator** - Input validation
- **SQLite** - Database (development)
