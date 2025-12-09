/**
 * P6: Hello-World Control Function
 * Purpose: Isolate infra vs code failures
 * This function should always deploy successfully if infrastructure is working
 */

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));

  return new Response(
    JSON.stringify({
      ok: true,
      echo: body,
      timestamp: new Date().toISOString(),
      deployment_check: 'passed',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
