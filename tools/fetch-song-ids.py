#!/usr/bin/env python3
"""Fetch Genius song ids + YouTube official-video ids for the bulk catalog.
Writes shared/catalog.js. Read-only public endpoints, polite delays."""
import json, re, sys, time, urllib.parse, urllib.request

UA = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15'}
GH = {**UA, 'X-Requested-With': 'XMLHttpRequest', 'Referer': 'https://genius.com/search/embed', 'Accept': 'application/json'}

def get(url, headers=UA):
    req = urllib.request.Request(url, headers=headers)
    return urllib.request.urlopen(req, timeout=20).read().decode('utf-8', 'replace')

def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

def genius_id(title, artist):
    q = urllib.parse.quote(f'{title} {artist}')
    d = json.loads(get(f'https://genius.com/api/search/multi?q={q}', GH))
    best = None
    for sec in d.get('response', {}).get('sections', []):
        for h in sec.get('hits', []):
            r = h.get('result', {})
            if 'title' not in r: continue
            a = norm(r.get('primary_artist', {}).get('name', ''))
            if norm(artist.split(' ft')[0].split(' &')[0].split(',')[0]) in a or a in norm(artist):
                return r.get('id')
            if best is None and norm(title.split('(')[0].strip()) in norm(r.get('title','')):
                best = r.get('id')
    return best

def youtube_id(title, artist):
    q = urllib.parse.quote(f'{title} {artist} official')
    html = get(f'https://www.youtube.com/results?search_query={q}')
    vids = []
    for v in re.findall(r'"videoId":"([\w-]{11})"', html):
        if v not in vids: vids.append(v)
    chans = re.findall(r'"longBylineText":\{"runs":\[\{"text":"([^"]+)"', html)
    want = norm(artist.split(' ft')[0].split(' &')[0].split(',')[0])
    for v, c in zip(vids, chans):
        if 'vevo' in norm(c) or want and want in norm(c):
            return v
    return vids[0] if vids else None

SONGS = [
    # (slug, title, artist, year, theme)
    # ---- desktop: nostalgic, 80s–00s pop
    ('tainted-love','Tainted Love','Soft Cell',1981,'desktop'),
    ('just-cant-get-enough','Just Can\'t Get Enough','Depeche Mode',1981,'desktop'),
    ('billie-jean','Billie Jean','Michael Jackson',1982,'desktop'),
    ('africa','Africa','Toto',1982,'desktop'),
    ('eye-of-the-tiger','Eye of the Tiger','Survivor',1982,'desktop'),
    ('come-on-eileen','Come On Eileen','Dexys Midnight Runners',1982,'desktop'),
    ('sweet-dreams','Sweet Dreams','Eurythmics',1983,'desktop'),
    ('girls-just-want-to-have-fun','Girls Just Want to Have Fun','Cyndi Lauper',1983,'desktop'),
    ('karma-chameleon','Karma Chameleon','Culture Club',1983,'desktop'),
    ('blue-monday','Blue Monday','New Order',1983,'desktop'),
    ('careless-whisper','Careless Whisper','George Michael',1984,'desktop'),
    ('you-spin-me-round','You Spin Me Round','Dead or Alive',1984,'desktop'),
    ('take-on-me','Take On Me','a-ha',1985,'desktop'),
    ('dont-you-forget-about-me',"Don't You (Forget About Me)",'Simple Minds',1985,'desktop'),
    ('everybody-wants-to-rule-the-world','Everybody Wants to Rule the World','Tears for Fears',1985,'desktop'),
    ('livin-on-a-prayer',"Livin' on a Prayer",'Bon Jovi',1986,'desktop'),
    ('i-wanna-dance-with-somebody','I Wanna Dance with Somebody','Whitney Houston',1987,'desktop'),
    ('sweet-child-o-mine',"Sweet Child o' Mine","Guns N' Roses",1987,'desktop'),
    ('faith','Faith','George Michael',1987,'desktop'),
    ('like-a-prayer','Like a Prayer','Madonna',1989,'desktop'),
    ('enjoy-the-silence','Enjoy the Silence','Depeche Mode',1990,'desktop'),
    ('vogue','Vogue','Madonna',1990,'desktop'),
    ('wannabe','Wannabe','Spice Girls',1996,'desktop'),
    ('mmmbop','MMMBop','Hanson',1997,'desktop'),
    ('barbie-girl','Barbie Girl','Aqua',1997,'desktop'),
    ('blue-da-ba-dee','Blue (Da Ba Dee)','Eiffel 65',1998,'desktop'),
    ('baby-one-more-time','...Baby One More Time','Britney Spears',1998,'desktop'),
    ('all-star','All Star','Smash Mouth',1999,'desktop'),
    ('oops-i-did-it-again','Oops!... I Did It Again','Britney Spears',2000,'desktop'),
    ('crazy-in-love','Crazy in Love','Beyoncé',2003,'desktop'),
    ('hey-ya','Hey Ya!','Outkast',2003,'desktop'),
    ('mr-brightside','Mr. Brightside','The Killers',2004,'desktop'),
    ('since-u-been-gone','Since U Been Gone','Kelly Clarkson',2004,'desktop'),
    ('umbrella','Umbrella','Rihanna',2007,'desktop'),
    ('i-gotta-feeling','I Gotta Feeling','Black Eyed Peas',2009,'desktop'),
    ('call-me-maybe','Call Me Maybe','Carly Rae Jepsen',2011,'desktop'),
    # ---- picnic: summery, mellow, fruit-adjacent
    ('surfin-usa','Surfin\' U.S.A.','The Beach Boys',1963,'picnic'),
    ('under-the-boardwalk','Under the Boardwalk','The Drifters',1964,'picnic'),
    ('california-dreamin','California Dreamin\'','The Mamas & the Papas',1965,'picnic'),
    ('wouldnt-it-be-nice',"Wouldn't It Be Nice",'The Beach Boys',1966,'picnic'),
    ('good-vibrations','Good Vibrations','The Beach Boys',1966,'picnic'),
    ('here-comes-the-sun','Here Comes the Sun','The Beatles',1969,'picnic'),
    ('coconut','Coconut','Harry Nilsson',1971,'picnic'),
    ('lean-on-me','Lean on Me','Bill Withers',1972,'picnic'),
    ('sunny','Sunny','Boney M.',1976,'picnic'),
    ('three-little-birds','Three Little Birds','Bob Marley',1977,'picnic'),
    ('lovely-day','Lovely Day','Bill Withers',1977,'picnic'),
    ('could-you-be-loved','Could You Be Loved','Bob Marley',1980,'picnic'),
    ('cruel-summer','Cruel Summer','Bananarama',1983,'picnic'),
    ('walking-on-sunshine','Walking on Sunshine','Katrina and the Waves',1985,'picnic'),
    ('kokomo','Kokomo','The Beach Boys',1988,'picnic'),
    ('dont-worry-be-happy',"Don't Worry, Be Happy",'Bobby McFerrin',1988,'picnic'),
    ('somewhere-over-the-rainbow','Somewhere Over the Rainbow','Israel Kamakawiwoʻole',1990,'picnic'),
    ('island-in-the-sun','Island in the Sun','Weezer',2001,'picnic'),
    ('banana-pancakes','Banana Pancakes','Jack Johnson',2005,'picnic'),
    ('better-together','Better Together','Jack Johnson',2005,'picnic'),
    ('california-gurls','California Gurls','Katy Perry',2010,'picnic'),
    ('ho-hey','Ho Hey','The Lumineers',2012,'picnic'),
    ('riptide','Riptide','Vance Joy',2013,'picnic'),
    ('best-day-of-my-life','Best Day of My Life','American Authors',2013,'picnic'),
    ('budapest','Budapest','George Ezra',2014,'picnic'),
    ('cake-by-the-ocean','Cake by the Ocean','DNCE',2015,'picnic'),
    ('cool-for-the-summer','Cool for the Summer','Demi Lovato',2015,'picnic'),
    ('sunflower','Sunflower','Post Malone & Swae Lee',2018,'picnic'),
    ('sunday-best','Sunday Best','Surfaces',2019,'picnic'),
    ('golden','Golden','Harry Styles',2020,'picnic'),
    # ---- kinetic: energetic, contemporary
    ('stronger','Stronger','Kanye West',2007,'kinetic'),
    ('poker-face','Poker Face','Lady Gaga',2008,'kinetic'),
    ('bad-romance','Bad Romance','Lady Gaga',2009,'kinetic'),
    ('power','Power','Kanye West',2010,'kinetic'),
    ('super-bass','Super Bass','Nicki Minaj',2011,'kinetic'),
    ('starships','Starships','Nicki Minaj',2012,'kinetic'),
    ('uptown-funk','Uptown Funk','Mark Ronson',2014,'kinetic'),
    ('shake-it-off','Shake It Off','Taylor Swift',2014,'kinetic'),
    ('cant-feel-my-face',"Can't Feel My Face",'The Weeknd',2015,'kinetic'),
    ('formation','Formation','Beyoncé',2016,'kinetic'),
    ('side-to-side','Side to Side','Ariana Grande',2016,'kinetic'),
    ('starboy','Starboy','The Weeknd',2016,'kinetic'),
    ('bodak-yellow','Bodak Yellow','Cardi B',2017,'kinetic'),
    ('dna','DNA.','Kendrick Lamar',2017,'kinetic'),
    ('truth-hurts','Truth Hurts','Lizzo',2017,'kinetic'),
    ('rockstar','rockstar','Post Malone',2017,'kinetic'),
    ('finesse','Finesse','Bruno Mars',2018,'kinetic'),
    ('thank-u-next','thank u, next','Ariana Grande',2018,'kinetic'),
    ('gods-plan',"God's Plan",'Drake',2018,'kinetic'),
    ('sicko-mode','SICKO MODE','Travis Scott',2018,'kinetic'),
    ('7-rings','7 rings','Ariana Grande',2019,'kinetic'),
    ('bad-guy','bad guy','Billie Eilish',2019,'kinetic'),
    ('old-town-road','Old Town Road','Lil Nas X',2019,'kinetic'),
    ('blinding-lights','Blinding Lights','The Weeknd',2019,'kinetic'),
    ('dont-start-now',"Don't Start Now",'Dua Lipa',2019,'kinetic'),
    ('wap','WAP','Cardi B',2020,'kinetic'),
    ('rain-on-me','Rain on Me','Lady Gaga',2020,'kinetic'),
    ('physical','Physical','Dua Lipa',2020,'kinetic'),
    ('montero','Montero','Lil Nas X',2021,'kinetic'),
    ('industry-baby','Industry Baby','Lil Nas X',2021,'kinetic'),
    ('kiss-me-more','Kiss Me More','Doja Cat',2021,'kinetic'),
    ('good-4-u','good 4 u','Olivia Rodrigo',2021,'kinetic'),
    ('paint-the-town-red','Paint the Town Red','Doja Cat',2023,'kinetic'),
    ('not-like-us','Not Like Us','Kendrick Lamar',2024,'kinetic'),
    ('espresso','Espresso','Sabrina Carpenter',2024,'kinetic'),
    ('birds-of-a-feather','BIRDS OF A FEATHER','Billie Eilish',2024,'kinetic'),
    ('apple','Apple','Charli XCX',2024,'kinetic'),
]

rows = []
fails = []
for i, (slug, title, artist, year, theme) in enumerate(SONGS):
    gid = yid = None
    try:
        gid = genius_id(title, artist)
    except Exception as e:
        print(f'  genius err {slug}: {e}', file=sys.stderr)
    time.sleep(0.25)
    try:
        yid = youtube_id(title, artist)
    except Exception as e:
        print(f'  yt err {slug}: {e}', file=sys.stderr)
    time.sleep(0.25)
    if not gid or not yid:
        fails.append((slug, gid, yid))
    rows.append((slug, title, artist, year, theme, yid, gid))
    print(f'{i+1}/{len(SONGS)} {slug}: yt={yid} genius={gid}')

out = 'shared/catalog.js'
with open(out, 'w') as f:
    f.write('// Generated bulk catalog — [slug, title, artist, year, theme, youtubeId, geniusId].\n')
    f.write('// youtubeId: first official/VEVO hit from YouTube search; geniusId: Genius song id.\n')
    f.write('// Regenerate: python3 tooling script (see AGENTS.md).\n')
    f.write('export const CATALOG = [\n')
    for r in rows:
        vals = [json.dumps(x) for x in r]
        f.write(f'  [{", ".join(vals)}],\n')
    f.write('];\n')
print('wrote', out, '| missing:', fails)
