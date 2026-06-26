# Autumn8 — Express Server

API gateway and real-time collaboration server for the Autumn8 workflow platform. Handles authentication, credit management, workflow CRUD, execution proxying, and WebSocket-based collaboration.

## Responsibilities

- **Authentication** — JWT-based auth with JTI for per-device session management. Sessions stored in Redis with TTL for instant revocation.
- **Credit System** — Redis-primary credit balances with PostgreSQL durability sync. Atomic deductions, pre-execution cost estimation, periodic background sync.
- **Workflow API** — CRUD operations against MongoDB. Save, load, create, delete workflows. Collaboration session management.
- **Execution Proxy** — Receives execute requests from the frontend, pre-validates credit sufficiency, proxies to FastAPI, deducts credits on success.
- **Real-time Collaboration** — Socket.io room-based architecture. Delta broadcasting for canvas changes, cursor sharing, session lifecycle management.
- **Progress Relay** — Receives execution progress callbacks from FastAPI and emits them to the correct Socket.io room.

## API Routes

### Public
| Method | Route | Description |
|--------|-------|-------------|
| POST | /auth/login | Login, returns JWT |
| POST | /auth/signup | Register new user |

### Protected (authGate)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /credits | Fetch user credit balance |
| GET | /workflows | List user's workflows |
| GET | /workflows/:id | Load a specific workflow |
| POST | /workflows/create | Create new workflow |
| POST | /workflows/save/:id | Save workflow (nodes, edges, name) |
| POST | /workflows/execute/:id | Execute workflow via FastAPI |
| POST | /workflows/collaborate/:id | Generate collaboration session |
| DELETE | /workflows/collaborate/:id | End collaboration session |
| POST | /workflows/collaborators/:id | Add collaborator to workflow |

### Internal (no auth — server-to-server)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /workflows/:id/progress | Execution progress callback from FastAPI |

## Socket.io Events

### Connection
- Auth via `socket.handshake.auth.token` (login JWT)
- Optional `collabToken` + `workflowId` for collaboration sessions

### Events
| Event | Direction | Description |
|-------|-----------|-------------|
| JOIN_WORKFLOW | Client → Server | Join a workflow room |
| USER_JOINED | Server → Room | Notify others of new participant |
| USER_LEFT | Server → Room | Notify others of disconnection |
| NODES_CHANGE | Bidirectional | Node position/delete deltas |
| EDGES_CHANGE | Bidirectional | Edge delete deltas |
| NODE_ADDED | Bidirectional | New node dropped on canvas |
| EDGE_ADDED | Bidirectional | New connection created |
| NODE_DATA_UPDATED | Bidirectional | Config panel changes |
| CURSOR_MOVEMENT | Bidirectional | Mouse position for cursor sharing |
| EXECUTION_PROGRESS | Server → Room | Execution engine progress events |
| SESSION_EXPIRED | Server → Room | Collaboration session ended |

## Middleware Chain

```
Request → CORS → authGate (JWT + Redis session) → creditGate (check only) → Controller
```

## Running

```bash
npm install
npm run dev
```

Requires `.env` with PostgreSQL, Redis, MongoDB, and JWT secret configuration. See root README for details.
