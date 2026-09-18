/**
 * TRANSPORT B - tRPC, over the vanilla client (no @tanstack/react-query,
 * no tRPC React bindings).
 */
import { createTRPCClient, httpBatchLink } from '@trpc/client'

// The contract, imported straight out of the Nest project's sources.
// `@backend/*` is the tsconfig.app.json alias for ../nest-trpc-poc/src/*, so
// this is the alias form of:
//   import type { AppRouter } from '../../nest-trpc-poc/src/trpc/trpc.router.js'
// `import type` is the whole trick: TypeScript reads trpc.router.ts for its
// types, then erases this line. No server code is bundled into the browser.
import type { AppRouter } from '@backend/trpc/trpc.router.js'

// Where the Nest tRPC middleware is mounted (TrpcModule -> .forRoutes('/trpc')).
export const TRPC_URL = 'http://localhost:3000/trpc'

export const trpc = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: TRPC_URL })],
})
