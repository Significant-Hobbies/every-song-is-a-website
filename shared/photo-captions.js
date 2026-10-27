// Shared authored captions for the visual world and public text representation.
export function photoCaptions(song) {
    // captions vary per song — hash of slug picks the memories, year dates them
    let h = 0;
    for (const c of song.slug) h = (h * 31 + c.charCodeAt(0)) | 0;
    const places = ['the bluffs', 'the lake', 'the rooftop', 'the quarry', 'the boardwalk', 'the drive-in'];
    const events = ['night drive', 'road trip', 'that party', 'first snow', 'graduation', 'the move', 'kitchen, 3am', 'prom night'];
    const last = ["somebody’s pool", 'the last summer', 'grandma’s kitchen', 'the mall', 'backstage-ish', 'the ferry'];
    const pick = (arr, i) => arr[Math.abs(h + i * 7) % arr.length];
    const yy = String(song.year ?? '99').slice(2);
    return [
      { cls: 'photo-sunset', cap: `${pick(places, 0)}, '${yy}` },
      { cls: 'photo-drive', cap: pick(events, 1) },
      { cls: 'photo-pool', cap: pick(last, 2) },
    ];
}
