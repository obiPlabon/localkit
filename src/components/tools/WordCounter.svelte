<script lang="ts">
  let text = $state('');

  const s = $derived.by(() => {
    const t = text.trim();
    const words = t ? t.split(/\s+/).length : 0;
    const sentences = t ? (t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).filter((x) => x.trim()).length : 0;
    const paragraphs = t ? t.split(/\n\s*\n/).filter((x) => x.trim()).length : 0;
    const seg = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter().segment(text)].length : [...text].length;
    const freq = new Map<string, number>();
    for (const w of t.toLowerCase().match(/[\p{L}\p{N}'’]+/gu) ?? []) freq.set(w, (freq.get(w) ?? 0) + 1);
    const top = [...freq].filter(([w]) => w.length > 2).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const mins = words / 238;
    return {
      words, sentences, paragraphs, chars: seg, noSpaces: text.replace(/\s/g, '').length,
      read: mins < 1 ? `${Math.max(words ? 1 : 0, Math.round(mins * 60))} sec` : `${Math.ceil(mins)} min`,
      speak: words / 140 < 1 ? `${Math.round((words / 140) * 60)} sec` : `${Math.ceil(words / 140)} min`,
      top,
    };
  });
</script>

<div class="tk">
  <textarea bind:value={text} spellcheck="true" placeholder="Type or paste your text" style="min-height:14rem" aria-label="Text"></textarea>
  <div class="stat-grid">
    <div class="stat"><b>{s.words.toLocaleString()}</b><span>Words</span></div>
    <div class="stat"><b>{s.chars.toLocaleString()}</b><span>Characters</span></div>
    <div class="stat"><b>{s.noSpaces.toLocaleString()}</b><span>No spaces</span></div>
    <div class="stat"><b>{s.sentences.toLocaleString()}</b><span>Sentences</span></div>
    <div class="stat"><b>{s.paragraphs.toLocaleString()}</b><span>Paragraphs</span></div>
    <div class="stat"><b>{s.read}</b><span>Reading time</span></div>
    <div class="stat"><b>{s.speak}</b><span>Speaking time</span></div>
  </div>
  {#if s.top.length}
    <div>
      <span class="lbl">Most used words</span>
      <div class="tk-row">{#each s.top as [w, n]}<span class="chip">{w} · {n}</span>{/each}</div>
    </div>
  {/if}
</div>
