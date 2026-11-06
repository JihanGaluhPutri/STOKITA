/**
 * Fake Supabase client untuk unit test.
 *
 * Meniru rantai query PostgREST (`from().select().eq()...`) dan `rpc()`
 * tanpa menyentuh jaringan — respons diatur per-test lewat `table()`/`rpc()`.
 * Semua pemanggilan dicatat agar test bisa memverifikasi filter/kolom yang
 * dikirim service (mis. otorisasi `eq kasir_id`).
 */

export type QueryResult = { data: unknown; error: unknown };

type Responder = QueryResult | (() => QueryResult);

type CallRecord = {
  kind: "table" | "rpc" | "auth";
  target: string;
  args: unknown[];
};

function resolveResponder(queue: Responder[] | undefined): QueryResult {
  if (!queue || queue.length === 0) {
    // Default aman: query daftar kosong tanpa error.
    return { data: [], error: null };
  }
  const next = queue.length > 1 ? queue.shift()! : queue[0];
  return typeof next === "function" ? next() : next;
}

export class FakeQuery {
  readonly calls: CallRecord[] = [];

  constructor(
    private readonly table: string,
    private readonly queue: Responder[] | undefined,
    private readonly log: CallRecord[],
  ) {}

  private step(method: string, ...args: unknown[]): this {
    this.calls.push({ kind: "table", target: `${this.table}.${method}`, args });
    this.log.push({ kind: "table", target: `${this.table}.${method}`, args });
    return this;
  }

  select(...args: unknown[]) {
    return this.step("select", ...args);
  }
  insert(...args: unknown[]) {
    return this.step("insert", ...args);
  }
  update(...args: unknown[]) {
    return this.step("update", ...args);
  }
  delete(...args: unknown[]) {
    return this.step("delete", ...args);
  }
  eq(...args: unknown[]) {
    return this.step("eq", ...args);
  }
  neq(...args: unknown[]) {
    return this.step("neq", ...args);
  }
  gt(...args: unknown[]) {
    return this.step("gt", ...args);
  }
  gte(...args: unknown[]) {
    return this.step("gte", ...args);
  }
  lt(...args: unknown[]) {
    return this.step("lt", ...args);
  }
  lte(...args: unknown[]) {
    return this.step("lte", ...args);
  }
  or(...args: unknown[]) {
    return this.step("or", ...args);
  }
  order(...args: unknown[]) {
    return this.step("order", ...args);
  }
  limit(...args: unknown[]) {
    return this.step("limit", ...args);
  }

  private settle(): QueryResult {
    return resolveResponder(this.queue);
  }

  single(): Promise<QueryResult> {
    return Promise.resolve(this.settle());
  }
  maybeSingle(): Promise<QueryResult> {
    return Promise.resolve(this.settle());
  }
  // `await query` (tanpa single) — rantai query bersifat thenable di Supabase.
  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.settle()).then(onfulfilled, onrejected);
  }
}

/** Lapisan `supabase.auth` — meniru API Supabase Auth yang dipakai aplikasi. */
export class FakeAuth {
  user: { id: string } | null = null;
  session: { user: { id: string } } | null = null;
  signInResult: QueryResult = {
    data: { user: { id: "user-1" }, session: {} },
    error: null,
  };
  signOutResult: QueryResult = { data: null, error: null };
  readonly signInCalls: Array<{ email: string; password: string }> = [];
  signOutCalls = 0;

  async getUser() {
    return { data: { user: this.user }, error: null };
  }
  async getSession() {
    return { data: { session: this.session }, error: null };
  }
  async signInWithPassword(creds: { email: string; password: string }) {
    this.signInCalls.push(creds);
    return this.signInResult;
  }
  async signOut() {
    this.signOutCalls += 1;
    return this.signOutResult;
  }
}

export class FakeSupabase {
  private readonly tables = new Map<string, Responder[]>();
  private readonly rpcs = new Map<string, Responder[]>();
  readonly calls: CallRecord[] = [];

  readonly auth = new FakeAuth();

  /** Atur respons sebuah tabel. Beberapa argumen = respons berurutan. */
  table(name: string, ...responders: Responder[]): this {
    this.tables.set(name, responders);
    return this;
  }

  /**
   * Atur respons sebuah fungsi RPC (konfigurasi, bukan pemanggilan).
   * Beberapa argumen = respons berurutan.
   */
  rpcResult(name: string, ...responders: Responder[]): this {
    this.rpcs.set(name, responders);
    return this;
  }

  /** Mode siap-pakai: sesi aktif sebagai role tertentu + baris profil. */
  signedInAs(profile: {
    id: string;
    nama: string;
    username: string;
    role: string;
  }): this {
    this.auth.user = { id: profile.id };
    this.auth.session = { user: { id: profile.id } };
    this.table("profiles", {
      data: {
        nama: profile.nama,
        username: profile.username,
        role: profile.role,
      },
      error: null,
    });
    return this;
  }

  from(table: string): FakeQuery {
    return new FakeQuery(table, this.tables.get(table), this.calls);
  }

  async rpc(name: string, args: unknown): Promise<QueryResult> {
    this.calls.push({ kind: "rpc", target: name, args: [args] });
    return resolveResponder(this.rpcs.get(name));
  }

  /** Cari catatan pemanggilan berdasarkan pola target (mis. "sales.eq"). */
  findCalls(pattern: string | RegExp): CallRecord[] {
    const match =
      typeof pattern === "string"
        ? (c: CallRecord) => c.target.includes(pattern)
        : (c: CallRecord) => pattern.test(c.target);
    return this.calls.filter(match);
  }
}
