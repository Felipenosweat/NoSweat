# Gera server/places/us-places.json (cidades e towns dos EUA com população e coordenadas).
# Fontes (baixar numa pasta vazia e passar o caminho dela como 1º argumento):
#   https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_place_national.zip
#   https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2023_Gazetteer/2023_Gaz_cousubs_national.zip
#   https://www2.census.gov/programs-surveys/popest/datasets/2020-2023/cities/totals/sub-est2023.csv
#   https://download.geonames.org/export/dump/cities1000.zip   (CC BY 4.0: manter o crédito em /credits)
# Descompacte os .zip e rode: python3 -I build-places.py <pasta> ../us-places.json
import csv, json, re, sys
raw, out = sys.argv[1], sys.argv[2]
TOWN_STATES = {"CT","ME","MA","NH","RI","VT","NJ","NY","PA"}
SUFFIX = re.compile(r"\s+(city and borough|consolidated government|unified government|metropolitan government|urban county|city|town|village|borough|township|CDP|municipality|plantation|corporation|comunidad|zona urbana|charter township|gore|grant|location|purchase|reservation)$", re.I)
pop_place, pop_cousub = {}, {}
with open(f"{raw}/sub-est2023.csv", encoding="latin-1") as f:
    for r in csv.DictReader(f):
        p = int(r["POPESTIMATE2023"] or 0)
        if r["SUMLEV"] in ("162", "170", "172"):
            pop_place[r["STATE"] + r["PLACE"]] = max(p, pop_place.get(r["STATE"] + r["PLACE"], 0))
        elif r["SUMLEV"] == "061":
            pop_cousub[r["STATE"] + r["COUNTY"] + r["COUSUB"]] = p
# População do GeoNames (CC BY 4.0) para lugares sem estimativa do Census (CDPs).
geo_pop = {}
with open(f"{raw}/cities1000.txt", encoding="utf-8") as f:
    for line in f:
        c = line.rstrip("\n").split("\t")
        if c[8] != "US" or not c[14].isdigit():
            continue
        k = (c[1].lower(), c[10])
        geo_pop[k] = max(int(c[14]), geo_pop.get(k, 0))
def clean(name):
    if "(balance)" in name or "unorganized" in name.lower() or "not defined" in name.lower():
        return None
    n = SUFFIX.sub("", name.strip())
    n = re.sub(r"\s+", " ", n)
    return n or None
best = {}
def add(name, st, lat, lon, pop):
    n = clean(name)
    if not n or st == "PR":
        return
    k = (n.lower(), st)
    if k not in best or pop > best[k][4]:
        best[k] = (n, st, lat, lon, pop)
with open(f"{raw}/2023_Gaz_place_national.txt", encoding="latin-1") as f:
    r = csv.reader(f, delimiter="\t"); next(r)
    for row in r:
        row = [c.strip() for c in row]
        st, geoid, name = row[0], row[1], row[3]
        pop = pop_place.get(geoid, 0)
        if pop == 0:
            n = clean(name)
            pop = geo_pop.get((n.lower(), st), 0) if n else 0
        add(name, st, float(row[10]), float(row[11]), pop)
with open(f"{raw}/2023_Gaz_cousubs_national.txt", encoding="latin-1") as f:
    r = csv.reader(f, delimiter="\t"); next(r)
    for row in r:
        row = [c.strip() for c in row]
        st, geoid, name, funcstat = row[0], row[1], row[3], row[4]
        if st not in TOWN_STATES or funcstat != "A":
            continue
        add(name, st, float(row[9]), float(row[10]), pop_cousub.get(geoid, 0))
items = sorted(best.values(), key=lambda x: (-x[4], x[1], x[0]))
# Mantém lugares com 500+ moradores e todos os CDPs com nome (sem população conhecida) acima de... nada:
keep = [x for x in items if x[4] >= 500]
states = sorted({x[1] for x in keep})
idx = {s: i for i, s in enumerate(states)}
data = {
    "source": "U.S. Census Bureau 2023 Gazetteer and Vintage 2023 population estimates (public domain); population of unincorporated places from GeoNames (CC BY 4.0).",
    "states": states,
    # [nome, índice do estado, lat×1000, lon×1000, população]
    "places": [[n, idx[s], round(la * 1000), round(lo * 1000), p] for n, s, la, lo, p in keep],
}
json.dump(data, open(out, "w"), separators=(",", ":"), ensure_ascii=False)
print(len(keep), "places;", len(states), "states")
