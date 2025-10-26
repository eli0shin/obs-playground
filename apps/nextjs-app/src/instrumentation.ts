export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only initialize OTel if NOT using custom server
    // Custom server handles OTel initialization in server.ts
    if (process.env.CUSTOM_SERVER !== 'true') {
      await import('./otel');
    }
  }
}
