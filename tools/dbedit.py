"""Surgical edits of data/db.json that keep the file's formatting: only the touched value is re-serialised (2-space style).
Used by the law tools (armament_law.py). get(section, id) returns the parsed entry; set_key / set_path rewrite one value."""
import json, os
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'db.json')
class DB:
    def __init__(self, path=DB_PATH): self.path = path; self.txt = open(path).read()
    def _entry(self, section, eid):
        sec = self.txt.index('\n  "%s": {' % section); k = self.txt.index('\n    "%s": {' % eid, sec)
        v0 = self.txt.index('{', k + 1); o, v1 = json.JSONDecoder().raw_decode(self.txt, v0); return o, v0, v1
    def get(self, section, eid): return self._entry(section, eid)[0]
    def set_key(self, section, eid, key, val):
        """Set a top-level key of an entry; nested values are dumped in the expanded 2-space style at the right depth."""
        o, v0, v1 = self._entry(section, eid); seg = self.txt[v0:v1]
        dump = json.dumps(val, indent=2, ensure_ascii=False).replace('\n', '\n      ')
        tag = '\n      "%s":' % key
        if tag in seg:
            a = seg.index(tag) + len(tag)
            while seg[a] == ' ': a += 1
            _, b = json.JSONDecoder().raw_decode(seg, a); seg = seg[:a] + dump + seg[b:]
        else: seg = seg[:1] + '\n      "%s": %s,' % (key, dump) + seg[1:]
        self.txt = self.txt[:v0] + seg + self.txt[v1:]
    def save(self): json.loads(self.txt); open(self.path, 'w').write(self.txt)
def add_section_key(db, section, key, val):
    """Insert a new key at the start of a top-level section (e.g. tuning.armamentLaw)."""
    sec = db.txt.index('\n  "%s": {' % section) + len('\n  "%s": {' % section)
    dump = json.dumps(val, indent=2, ensure_ascii=False).replace('\n', '\n    ')
    db.txt = db.txt[:sec] + '\n    "%s": %s,' % (key, dump) + db.txt[sec:]
