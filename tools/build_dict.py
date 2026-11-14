"""Construit data/dict-fr.json (dérivé de CFDICT, CC BY-SA 3.0) croisé avec les niveaux HSK 3.0 (MIT)."""
import csv, json, re, sys, unicodedata

TONES = {'a': 'āáǎà', 'e': 'ēéěè', 'i': 'īíǐì', 'o': 'ōóǒò', 'u': 'ūúǔù', 'ü': 'ǖǘǚǜ'}


def syl(s):
    m = re.fullmatch(r"([a-zü:v]+)([1-5])", s, re.I)
    if not m:
        return s.replace('u:', 'ü').replace('v', 'ü') if s.isalpha() else s
    base, t = m.group(1).lower().replace('u:', 'ü').replace('v', 'ü'), int(m.group(2))
    if t == 5:
        return base
    for v in ('a', 'e'):
        if v in base:
            return base.replace(v, TONES[v][t - 1], 1)
    if 'ou' in base:
        return base.replace('o', TONES['o'][t - 1], 1)
    idx = max(i for i, c in enumerate(base) if c in 'aeiouü') if any(c in 'aeiouü' for c in base) else -1
    if idx < 0:
        return base
    return base[:idx] + TONES[base[idx]][t - 1] + base[idx + 1:]


def marked(py):
    parts = py.split()
    out = []
    for p in parts:
        cap = p[:1].isupper()
        s = syl(p)
        out.append(s[:1].upper() + s[1:] if cap else s)
    if not all(re.fullmatch(r"[a-zA-Zü:]+[1-5]?", p) for p in parts) or any(p[:1].isupper() for p in parts[1:]):
        return ' '.join(out)
    # recolle les syllabes d'un même mot, avec apostrophe devant a, e, o
    w = out[0]
    for s in out[1:]:
        if s == 'r':
            w += 'r'
        elif strip(s)[:1] in 'aeo':
            w += "'" + s
        else:
            w += s
    return w


def strip(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').replace('ü', 'u').lower()


def main(cfdict, hsk_csv, out):
    levels = {}
    hskpy = {}
    order = {}
    for i, r in enumerate(csv.DictReader(open(hsk_csv, encoding='utf-8'))):
        lv = r['Level']
        lvn = 7 if lv == '7-9' else int(lv)
        for w in r['Simplified'].split('|'):
            if w not in levels or lvn < levels[w]:
                levels[w] = lvn
                order[w] = i
        for w, p in zip(r['Simplified'].split('|'), r['Pinyin'].split('|')):
            hskpy.setdefault(w, set()).add(p)
    entries = []
    for line in open(cfdict, encoding='utf-8'):
        if line.startswith('#') or not line.strip():
            continue
        m = re.match(r"(\S+) (\S+) \[([^\]]*)\] /(.*)/\s*$", line)
        if not m:
            continue
        trad, simp, py, defs = m.groups()
        defs = [d.strip() for d in defs.split('/') if d.strip()]
        if not defs:
            continue
        lv = levels.get(simp, 0)
        pm = marked(py)
        for hp in hskpy.get(simp, ()):
            if strip(hp).replace("'", '') == strip(pm).replace("'", '').replace(' ', ''):
                pm = hp
        entries.append([simp, '' if trad == simp else trad, pm, '/'.join(defs), lv, order.get(simp, 99999)])
    # mots HSK d'abord (par niveau puis ordre de liste), puis le reste par longueur
    entries.sort(key=lambda e: (e[4] == 0, e[4] or 9, e[5], len(e[0])))
    for e in entries:
        e.pop()
    json.dump({'v': 1, 'source': 'CFDICT 14/12/2024, chine.in, CC BY-SA 3.0 ; niveaux HSK 3.0 ivankra/hsk30 (MIT)', 'e': entries},
              open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    covered = sum(1 for w in levels if any(True for _ in [0]))
    print(len(entries), 'entrées')


if __name__ == '__main__':
    main(*sys.argv[1:])
