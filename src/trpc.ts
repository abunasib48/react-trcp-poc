import { createTRPCClient, httpLink } from '@trpc/client'
// The ONLY thing shared with the backend: its router TYPE.
// Resolved via the `@backend/*` path alias in tsconfig.app.json ->
// ../nest-trpc-poc/dist/trpc/trpc.router.d.ts
// `import type` means zero runtime coupling: this line disappears at build time.
import type { AppRouter } from '@backend/trpc/trpc.router.js'

// Where the NestJS tRPC middleware is mounted (TrpcModule.forRoutes('/trpc')).
export const TRPC_URL = 'http://localhost:3000/trpc'

/**
 * The tRPC client.
 *
 *   React component
 *        |  trpc.user.getById.query({ id: 2 })
 *        v
 *   tRPC client  (this object -- a Proxy, not generated code)
 *        |  builds an HTTP request from the property path + args
 *        v
 *   GET http://localhost:3000/trpc/user.getById?input={"id":2}
 *        |
 *        v
 *   NestJS express middleware -> appRouter -> user.getById
 *
 * <AppRouter> is what makes the whole chain type-safe. It carries no JS,
 * only the shape of every procedure: its path, its input and its output.
 */
export const trpc = createTRPCClient<AppRouter>({
  links: [
    // httpLink = one HTTP request per call, so the Network tab shows exactly
    //   GET /trpc/user.getById?input={"id":2}
    // (httpBatchLink would merge concurrent calls into ?batch=1&input={"0":...})
    httpLink({
      url: TRPC_URL,
    }),
  ],
})
