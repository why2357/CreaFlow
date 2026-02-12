# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **创流 (Forge HiVision)** - a video production workbench built with Vue 3 + TypeScript + Element Plus + Vite. It's a multi-tenant SaaS platform for creating AI-generated video content through a structured workflow involving scripts, storyboards, image generation, and video synthesis.

## Development Commands

```bash
# Install dependencies
npm install --registry=https://registry.npmmirror.com

# Development server (port 80 by default, proxied to backend at :16020)
npm run dev

# Production build
npm run build:prod

# Lint and fix
npm run lint

# Format code
npm run prettier
```

**Node version requirement**: v16

## Architecture Overview

### Directory Structure

```
src/
├── api/               # API endpoints organized by domain (system, workbench, monitor, etc.)
│   └── [domain]/      # Each has index.ts (requests) and types.ts (TypeScript types)
├── assets/            # Static assets (styles, images, SVG icons)
├── components/         # Reusable UI components (DictTag, FileUpload, ImageUpload, etc.)
├── composables/       # Vue 3 composition functions (useSSEListener, useAutoScroll)
├── directive/         # Custom Vue directives (permissions, copy text)
├── enums/            # TypeScript enums (MenuTypeEnum, RespEnum, etc.)
├── lang/             # i18n translations (zh_CN, en_US)
├── layout/           # Layout components (sidebar, header, tags view)
├── plugins/          # Vue plugins (auth, cache, download, modal, svg icon)
├── router/           # Vue Router configuration (constant + dynamic routes)
├── store/            # Pinia stores (modules: app, user, permission, project, etc.)
├── utils/            # Utilities (request, SSE, WebSocket, auth, crypto, dict)
└── views/            # Page components organized by feature
    ├── workbench/    # Main workbench area
    │   ├── project-admin/      # Project list/management
    │   └── project-creation/  # Core 5-step workflow
    │       └── steps/
    │           ├── StepCharacter/   # Character upload
    │           ├── StepScene/       # Scene upload
    │           ├── StepScript/      # Script generation
    │           ├── StepShotList/    # Shot list/storyboard
    │           ├── StepGridView/    # Grid view preview
    │           └── StepVideo/      # Video generation
    ├── system/       # System management (user, role, menu, etc.)
    └── monitor/      # Monitoring features
```

### Key Architectural Patterns

**API Layer Pattern**: Each API domain has two files:
- `index.ts` - API request functions using the axios instance from `@/utils/request`
- `types.ts` - TypeScript types/interfaces for requests and responses

**Store Pattern**: Pinia stores in `src/store/modules/` are organized by feature (app, user, permission, project, dict, etc.).

**Route Structure**:
- **Constant routes** - Public pages (login, home, 404, etc.)
- **Dynamic routes** - Loaded based on user permissions from backend
- Routes support meta properties for permissions, caching, and navigation control

**Project Creation Workflow**: The core feature is a 5-step workflow in `src/views/workbench/project-creation/`:
1. StepCharacter - Upload character reference images
2. StepScene - Upload scene reference images
3. StepScript - Generate scripts from prompts
4. StepShotList - Review/edit storyboard shots
5. StepGridView - Grid preview of generated images
6. StepVideo - Generate final videos from storyboards

### Real-time Communication

**SSE (Server-Sent Events)**: Used for real-time updates during AI content generation
- Manager: `src/utils/sse.ts` - SSE connection management with auto-reconnect
- Tab Coordination: `src/utils/sseTabCoordinator.ts` - Coordinates SSE across browser tabs
- Composables: `src/composables/useSSEListener.ts` - Vue 3 hooks for listening to SSE events
- Message Types:
  - `messageType=1`: Script generation complete
  - `messageType=2`: Image generation updates
  - `messageType=3`: Video generation updates

**Custom Events**: SSE messages are dispatched as window events:
- `sse-script-update`
- `sse-image-update`
- `sse-video-update`

### Auto-Import Configuration

**Vue APIs**: Automatically imported from `vue`, `vue-router`, `pinia`, `@vueuse/core` (configured in `vite/plugins/auto-import.ts`)

**Element Plus Components**: Auto-imported via `unplugin-vue-components` with ElementPlusResolver

**Element Plus APIs**: ElMessage, ElMessageBox, etc. are auto-imported

**Icons**: SVG icons in `src/assets/icons/svg/` are registered and can be used with the SvgIcon component

### Request/Response Handling

**Axios Configuration** (`src/utils/request.ts`):
- Base URL from `VITE_APP_BASE_API` env variable
- JWT token via `Authorization: Bearer ${token}`
- Request encryption support (AES + RSA hybrid)
- Automatic 401 handling with re-login prompt
- Duplicate request prevention (500ms interval)

**Response Handling**:
- Success: `code === 200`
- Custom error codes in `src/utils/errorCode.ts`
- Loading states for downloads

### Permission System

**Route Permissions**: Dynamic routes filtered by backend permissions
**Directive Permissions**: `v-hasPermi` directive for element-level permission control
**Project Permissions**: Additional permission system for project-based access control

### i18n Support

- Translations in `src/lang/` (zh_CN, en_US)
- Use `useI18n()` composable or `$t()` in templates
- Locale stored in localStorage as `language`

### Environment Variables

- `VITE_APP_BASE_API` - Backend API base path
- `VITE_APP_CLIENT_ID` - OAuth client ID
- `VITE_APP_CONTEXT_PATH` - Deployment context path
- `VITE_APP_PORT` - Dev server port (default 80)

### Component Naming Conventions

- Multi-word component names required
- Use PascalCase for `.vue` files
- Components auto-imported from `src/components/` path

### Proxy Configuration

Dev server proxies API requests to backend (default: `http://172.28.44.150:16020`)

### Testing

Vitest is configured for unit testing (`.vitest` config in package.json)
