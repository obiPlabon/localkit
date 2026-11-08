<script lang="ts">
  let token = $state('');

  function part(s: string): unknown {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  const decoded = $derived.by(() => {
    const t = token.trim().replace(/^Bearer\s+/i, '');
    if (!t) return null;
    const p = t.split('.');
    if (p.length < 2 || p.length > 3) return { error: 'A JWT has 3 parts separated by dots.' };
    try {
      return { header: part(p[0]) as Record<string, unknown>, payload: part(p[1]) as Record<string, unknown>, sig: p[2] ?? '' };
    } catch {
      return { error: 'Could not decode this token. Is it a valid JWT?' };
    }
  });

  const times = ['exp', 'iat', 'nbf'] as const;
  const labels = { exp: 'Expires', iat: 'Issued', nbf: 'Not before' };
  function timeRows(payload: Record<string, unknown>) {
    return times.filter((k) => typeof payload[k] === 'number').map((k) => ({ k, date: new Date((payload[k] as number) * 1000) }));
  }
  const now = Date.now();
</script>

<div class="tk">
  <div>
    <label class="lbl" for="jwt-in">Token</label>
    <textarea id="jwt-in" bind:value={token} spellcheck="false" placeholder="eyJhbGciOiJIUzI1NiIs…" style="min-height:8rem"></textarea>
  </div>
  {#if decoded && 'error' in decoded}
    <p class="err" role="alert">{decoded.error}</p>
  {:else if decoded}
    {@const rows = timeRows(decoded.payload)}
    <div class="tk-grid2">
      <div><span class="lbl">Header</span><pre>{JSON.stringify(decoded.header, null, 2)}</pre></div>
      <div><span class="lbl">Payload</span><pre>{JSON.stringify(decoded.payload, null, 2)}</pre></div>
    </div>
    {#if rows.length}
      <table class="kv">
        <tbody>
          {#each rows as r}
            <tr><th>{labels[r.k]}</th><td>{r.date.toLocaleString()}
              {#if r.k === 'exp'}<strong class={r.date.getTime() < now ? 'err' : 'ok'}> · {r.date.getTime() < now ? 'expired' : 'valid'}</strong>{/if}</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
    <div><span class="lbl">Signature</span><p class="mono-out">{decoded.sig || '(none)'}</p></div>
    <p class="muted">Decoded only. The signature is not verified, so don't treat these claims as trusted.</p>
  {/if}
</div>
