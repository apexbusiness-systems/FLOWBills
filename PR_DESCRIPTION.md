# FlowBills Product Enhancements & Hardening

This PR addresses all items in the primary work plan, aiming to make FLOWBills feel and behave like a category-leading oil & gas invoice automation app, WITHOUT adding any new dependencies, queues, vendors, or SaaS subscriptions.

## Part A: Canonical contracts and status normalization
* Created `src/lib/domain/constants.ts` to centralize standard enums and IDs.
* Refactored `src/hooks/useInvoices.tsx` and edge functions `invoice-intake`, `hil-router` to utilize these constants.
* Added missing enums to DB schema (`validated`, `approved_auto`, `needs_review`) via new migration `20260309000000_update_invoice_status.sql`.

## Part B: Binary-safe extraction pipeline
* `src/pages/Invoices.tsx` now downloads Blobs and converts them safely to Base64 using `FileReader.readAsDataURL` instead of the text-corrupting `Blob.text()`.
* `src/hooks/useInvoiceExtraction.tsx` was extended with tests to verify proper payload construction to the extract edge function.

## Part C: Correctness fixes in invoice data loading
* Prevented `vendor_name` from being forcibly overwritten to "Unknown Vendor" on read/write in `useInvoices.tsx`.
* Replaced iterative single-document lookups with a batched array `.in()` search to solve N+1 performance bugs in `InvoiceListVirtualized.tsx`.

## Part D: Query/cache modernization
* Removed custom local loading and caching logic in `useInvoices.tsx` and replaced it with `useQuery`, `useMutation`, and `queryClient` from `@tanstack/react-query`.
* Only updated invoices to safely contain scope.

## Part E: Metrics, health, and trustworthiness
* Removed mock variables `http_request_duration_avg` and `invoice_processing_duration_avg` from `supabase/functions/metrics/index.ts`.
* Removed hardcoded stale build dates from `supabase/functions/health-check/index.ts`.
* Corrected endpoint path mapping from `/api/metrics` to `.../functions/v1/metrics` in `src/lib/performance-monitor.ts`.

## Part F: Security and accessibility hardening
* Unlocked zooming capability for accessibility by removing `user-scalable=no` from the viewport meta.
* Re-enabled right-click and keyboard developer commands (F12) for debugging flexibility.
* Commented out `'unsafe-eval'` from CSP in production policy arrays.

## Part G: AI surface cleanup and production-safe alignment
* Decoupled Model IDs and API Endpoints to `Deno.env` boundaries across `oil-gas-assistant`, `ai-assistant` and `support-chat`.
* Created an adapter seam in `support-chat` to prepare for WebRTC integration while keeping existing transport running.
* Re-branded all instances of "FlowAi" to "FLOWBills".
* Labeled AI retrieval components honestly to clarify built-in knowledge.

## Part H: E-invoicing honesty and resilience
* Updated e-invoice validation payloads to output structured machine-readable error codes (e.g. `ERR-EN16931-01`).
* Updated Edge functions and documentation to clarify validation is "preflight" and does not assert full standard compliance.

## Part I: Best-in-class UX
* Set up a global command palette (`cmdk`) to enable search, navigation, and upload actions via `Cmd/Ctrl+K` bindings.
* Integrated system, light, and dark mode toggles seamlessly using `next-themes` and standard Tailwind configurations.
* Saved views on the Invoices interface synchronize with URL `searchParams` and local storage allowing states to persist.

Tested against unit/integration vitest configs, strict type-checking, linter validation, and Playwright workflows.
