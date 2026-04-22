// Deno test stub — real tests filled in Task 5.
// `Deno.test.ignore` is the Deno equivalent of vitest's `it.todo` — registers
// the test name without executing it.
//
// @ts-expect-error — `Deno` is the Deno runtime global, not present in TS DOM lib.
Deno.test.ignore('delete-user: 401 without Authorization header (T-7-02)', async () => {});
// @ts-expect-error
Deno.test.ignore('delete-user: 401 with invalid JWT', async () => {});
// @ts-expect-error
Deno.test.ignore('delete-user: 200 and deletes auth.users + profile cascade on valid JWT', async () => {});
// @ts-expect-error
Deno.test.ignore('delete-user: only deletes the JWT-identified user (no cross-account deletion)', async () => {});
