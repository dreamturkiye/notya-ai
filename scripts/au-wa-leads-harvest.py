#!/usr/bin/env python3
"""
AU private-practice lead harvest — TR-scale directory pull for Australia.

Primary source: HealthShare public professionals API
  GET /api/professionals/v1/search/?name={letter}&specialty={id}&limit=100
  GET /api/professionals/v1/profile/{id}/

Focus specialties (same wave as TR pedi/KD/derm + AU dietetics):
  56  Paediatrician
  67  Dermatologist
  66  Dietitian
  225 Obstetrician
  224 Gynaecologist

Outputs under docs/growth/au/ (never mixed into TR CSVs):
  au-healthshare-leads.csv          full harvest (all profiles found)
  au-healthshare-leads.ozet.json    counts by specialty / state / phone
  au-call-ready-leads.csv           rows with at least one phone
  au-whatsapp-call-ready.csv        rows with AU mobile (04xx → +614)
  au-asdp-paeds-directory.csv       optional ASDP supplement (--asdp)

Classification: GTM / growth ops only. Not product spine.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import time
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "growth" / "au"
UA = "NotyaLeadResearch/1.0 (AU research; hello@notya.io)"
SEARCH = "https://www.healthshare.com.au/api/professionals/v1/search/"
PROFILE = "https://www.healthshare.com.au/api/professionals/v1/profile/{id}/"
DEMO = "www.au.notya.io/au/demo"
CAL = "www.cal.com/han-mamur-sugmbo/demo-au"
TRIAL = "www.au.notya.io"

# HealthShare specialty_id → our branş slug
SPECIALTIES = {
    56: "paediatrics",
    67: "dermatology",
    66: "dietetics",
    225: "obstetrics-gynaecology",
    224: "obstetrics-gynaecology",
}

LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def session() -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept": "application/json"})
    return s


def norm_mobile(raw: str) -> str:
    d = re.sub(r"\D", "", raw or "")
    if d.startswith("61"):
        d = d[2:]
    if d.startswith("0"):
        d = d[1:]
    if len(d) == 9 and d.startswith("4"):
        return "+61" + d
    return ""


def norm_land(raw: str) -> str:
    d = re.sub(r"\D", "", raw or "")
    if d.startswith("61"):
        d = d[2:]
    if d.startswith("0"):
        d = d[1:]
    if len(d) == 9 and d[0] in "2378":
        return "+61" + d
    if len(d) == 10 and d.startswith("1300"):
        return "+61" + d  # keep 1300 as-is poorly — skip
    return ""


def norm_any_phone(raw: str) -> str:
    return norm_mobile(raw) or norm_land(raw) or ""


def parse_state_city(location: str, address: str = "") -> tuple[str, str]:
    state = ""
    city = ""
    blob = f"{location or ''} {address or ''}"
    m = re.search(r"\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b", blob)
    if m:
        state = m.group(1)
    # city from "Suburb STATE postcode" in address
    m2 = re.search(r"([A-Za-z][A-Za-z\s\-']+?)\s+(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\s+\d{4}", address or "")
    if m2:
        city = m2.group(1).strip()
    elif location and "," in location:
        city = location.split(",")[0].strip()
        if city.startswith(("2 practices", "3 practices", "4 practices", "5 practices")):
            city = ""
    return state, city


def fetch_specialty(s: requests.Session, specialty_id: int, delay: float) -> dict[int, dict]:
    """A–Z name sweep + specialty filter; dedupe by professional id."""
    found: dict[int, dict] = {}
    label = SPECIALTIES[specialty_id]
    for ch in LETTERS:
        page = 1
        while page <= 80:
            r = s.get(
                SEARCH,
                params={"name": ch, "specialty": specialty_id, "limit": 100, "page": page},
                timeout=40,
            )
            if r.status_code != 200:
                print(f"  WARN search {label} {ch} p{page}: {r.status_code}")
                break
            j = r.json()
            batch = j.get("results") or []
            for row in batch:
                pid = row.get("id")
                if not pid:
                    continue
                prev = found.get(pid)
                # keep row; merge specialty labels if seen under both O&G ids
                if prev:
                    continue
                found[pid] = {
                    "id": pid,
                    "title": row.get("title") or "",
                    "first_name": row.get("first_name") or "",
                    "last_name": row.get("last_name") or "",
                    "qualifications": row.get("qualifications_title") or "",
                    "location": row.get("location") or "",
                    "specialties": list(row.get("specialties") or []),
                    "profile_url": row.get("profile_url") or "",
                    "specialty": label,
                }
            print(f"  {label} {ch} p{page}: +{len(batch)} (unique {len(found)}, api_count={j.get('count')})")
            if not j.get("next") or not batch:
                break
            page += 1
            time.sleep(delay)
        time.sleep(delay)
    return found


def enrich_profile(s: requests.Session, pid: int) -> dict:
    try:
        r = s.get(PROFILE.format(id=pid), timeout=30)
        if r.status_code != 200:
            return {"id": pid, "ok": False, "status": r.status_code}
        j = r.json()
    except Exception as e:
        return {"id": pid, "ok": False, "err": str(e)}

    phones: list[str] = []
    mobiles: list[str] = []
    lands: list[str] = []
    emails: list[str] = []
    websites: list[str] = []
    addresses: list[str] = []
    states: list[str] = []

    for loc in j.get("locations") or []:
        if not isinstance(loc, dict):
            continue
        addr = (loc.get("address") or "").strip()
        if addr:
            addresses.append(addr)
        st = ((loc.get("locality") or {}).get("state") or {}).get("name") or ""
        if st:
            states.append(st)
        for ph in loc.get("phone_numbers") or []:
            num = ph.get("formatted_number") or ph.get("number") or ""
            if not num:
                continue
            phones.append(num)
            m = norm_mobile(num)
            if m:
                mobiles.append(m)
            else:
                l = norm_land(num)
                if l:
                    lands.append(l)
        pp = loc.get("practice_phone") or ""
        if pp:
            phones.append(pp)
            m = norm_mobile(pp)
            if m:
                mobiles.append(m)
            else:
                l = norm_land(pp)
                if l:
                    lands.append(l)
        em = (loc.get("email") or loc.get("practice_email") or "").strip()
        if em:
            emails.append(em)
        web = (loc.get("website") or "").strip()
        if web:
            websites.append(web)

    name = (j.get("name") or j.get("display_name") or "").strip()
    return {
        "id": pid,
        "ok": True,
        "name": name,
        "is_specialist": bool(j.get("is_specialist")),
        "is_gp": bool(j.get("is_GP")),
        "is_retired": bool(j.get("is_retired")),
        "offers_telehealth": bool(j.get("offers_telehealth")),
        "gender": j.get("gender_name") or "",
        "profile_url": j.get("profile_url") or "",
        "phones_raw": phones,
        "mobiles": sorted(set(mobiles)),
        "landlines": sorted(set(lands)),
        "emails": sorted(set(emails)),
        "websites": sorted(set(websites)),
        "addresses": addresses,
        "states": states,
        "qualifications": j.get("qualifications_title") or "",
    }


def score_row(row: dict) -> int:
    score = 40
    if row.get("whatsapp"):
        score += 40
    elif row.get("phone"):
        score += 25
    if row.get("email"):
        score += 10
    if row.get("website"):
        score += 8
    if row.get("private_practice") == "yes":
        score += 10
    if (row.get("title") or "").lower() in {"dr", "a/prof", "prof", "associate professor"}:
        score += 5
    if row.get("is_retired"):
        score -= 30
    return max(0, min(99, score))


def looks_private(addresses: list[str], websites: list[str]) -> str:
    blob = " ".join(addresses + websites).lower()
    hospitalish = any(
        x in blob
        for x in (
            "hospital",
            "health service",
            "local health",
            "nsw health",
            "metro north",
            "monash health",
            "alfred health",
            "rch ",
            "royal children's",
            "women's and children's",
        )
    )
    privateish = any(
        x in blob
        for x in (
            "private",
            "rooms",
            "clinic",
            "specialist centre",
            "medical centre",
            "suite",
        )
    )
    if privateish and not hospitalish:
        return "yes"
    if privateish:
        return "likely"
    if hospitalish and not privateish:
        return "hospital-leaning"
    return "unknown"


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})


def asdp_supplement(delay: float) -> list[dict]:
    """Optional ASDP Find-a-Specialist dump (paeds)."""
    rows: list[dict] = []
    for state in ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]:
        s = session()
        g = s.get("https://asdp.au/find-a-specialist", timeout=40)
        tok = re.search(r'name="_token"\s+value="([^"]+)"', g.text)
        if not tok:
            continue
        xsrf = s.cookies.get("XSRF-TOKEN")
        if xsrf:
            s.headers["X-XSRF-TOKEN"] = unquote(xsrf)
        p = s.post(
            "https://asdp.au/find-a-specialist",
            data={
                "_token": tok.group(1),
                "name": "",
                "country": "AU",
                "state": state,
                "city": "",
                "postcode": "",
                "s": "1",
            },
            headers={"Referer": "https://asdp.au/find-a-specialist", "Origin": "https://asdp.au"},
            timeout=50,
        )
        for block in re.split(r"<h2[^>]*>", p.text)[1:]:
            m = re.match(r"\s*([^<]+)", block)
            if not m:
                continue
            name = re.sub(r"\s+", " ", m.group(1)).strip()
            if not name.lower().startswith("dr"):
                continue
            phones = [x.strip() for x in re.findall(r"Phone:\s*([^<\n]+)", block)]
            emails = re.findall(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", block, re.I)
            webs = re.findall(r'Web:\s*<a[^>]+href="([^"]+)"', block)
            mobiles = [norm_mobile(ph) for ph in phones if norm_mobile(ph)]
            rows.append(
                {
                    "name": name,
                    "specialty": "paediatrics",
                    "state": state,
                    "phone": "; ".join(phones),
                    "whatsapp_candidate": mobiles[0] if mobiles else "",
                    "email": emails[0] if emails else "",
                    "website": webs[0] if webs else "",
                    "source": "asdp",
                    "private_practice": "likely",
                    "note": "ASDP Find-a-Specialist public listing",
                }
            )
        time.sleep(delay)
        print(f"ASDP {state}: running total {len(rows)}")
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description="AU HealthShare bulk lead harvest (~TR scale)")
    ap.add_argument("--delay", type=float, default=0.12)
    ap.add_argument("--enrich-workers", type=int, default=12)
    ap.add_argument("--skip-enrich", action="store_true", help="Search only; no profile phones")
    ap.add_argument("--asdp", action="store_true", help="Also refresh ASDP paeds directory CSV")
    ap.add_argument("--resume-json", type=Path, default=None, help="Skip search; enrich from saved JSON")
    ap.add_argument(
        "--specialties",
        default="56,67,66,225,224",
        help="Comma-separated HealthShare specialty ids",
    )
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    s = session()

    specialty_ids = [int(x) for x in args.specialties.split(",") if x.strip()]

    if args.resume_json:
        raw = json.loads(args.resume_json.read_text())
        found = {int(k): v for k, v in raw["by_id"].items()}
        print(f"Resumed {len(found)} from {args.resume_json}")
    else:
        found: dict[int, dict] = {}
        for sid in specialty_ids:
            print(f"\n=== Sweep specialty {sid} ({SPECIALTIES.get(sid, '?')}) ===")
            part = fetch_specialty(s, sid, args.delay)
            for pid, row in part.items():
                if pid in found:
                    # Prefer more specific label already set; O&G ids share slug anyway
                    continue
                found[pid] = row
            print(f"Running unique professionals: {len(found)}")

        mid = OUT / "au-healthshare-search.json"
        mid.write_text(json.dumps({"by_id": {str(k): v for k, v in found.items()}}, indent=2))
        print(f"Wrote search checkpoint {mid}")

    # Enrich profiles for phones
    enrich: dict[int, dict] = {}
    if not args.skip_enrich:
        ids = list(found.keys())
        print(f"\n=== Enriching {len(ids)} profiles (workers={args.enrich_workers}) ===")

        def one(pid: int) -> dict:
            ss = session()
            return enrich_profile(ss, pid)

        done = 0
        with ThreadPoolExecutor(max_workers=args.enrich_workers) as ex:
            futs = {ex.submit(one, pid): pid for pid in ids}
            for fut in as_completed(futs):
                info = fut.result()
                enrich[info["id"]] = info
                done += 1
                if done % 200 == 0 or done == len(ids):
                    ok = sum(1 for v in enrich.values() if v.get("ok"))
                    print(f"  enriched {done}/{len(ids)} (ok {ok})")

        (OUT / "au-healthshare-profiles.json").write_text(
            json.dumps({str(k): v for k, v in enrich.items()}, indent=2)
        )

    # Assemble rows
    rows: list[dict] = []
    for pid, base in found.items():
        info = enrich.get(pid) or {}
        title = base.get("title") or ""
        first = base.get("first_name") or ""
        last = base.get("last_name") or ""
        name = (info.get("name") if info.get("ok") else None) or " ".join(
            x for x in [title, first, last] if x
        ).strip()
        mobiles = info.get("mobiles") or []
        lands = info.get("landlines") or []
        emails = info.get("emails") or []
        websites = info.get("websites") or []
        addresses = info.get("addresses") or []
        states = info.get("states") or []
        address = addresses[0] if addresses else ""
        state, city = parse_state_city(base.get("location") or "", address)
        if not state and states:
            state = states[0]
        whatsapp = mobiles[0] if mobiles else ""
        phone = whatsapp or (lands[0] if lands else "")
        # also keep first raw phone if norm failed
        if not phone and info.get("phones_raw"):
            phone = info["phones_raw"][0]
        private = looks_private(addresses, websites) if info.get("ok") else "unknown"
        row = {
            "score": 0,
            "name": name,
            "title": title,
            "first_name": first,
            "last_name": last,
            "specialty": base.get("specialty") or "",
            "state": state,
            "city": city,
            "phone": phone,
            "whatsapp": whatsapp,
            "landline": lands[0] if lands else "",
            "email": emails[0] if emails else "",
            "address": address,
            "website": websites[0] if websites else "",
            "private_practice": private,
            "source": "healthshare",
            "profile_url": info.get("profile_url") or base.get("profile_url") or "",
            "healthshare_id": pid,
            "qualifications": info.get("qualifications") or base.get("qualifications") or "",
            "is_retired": "yes" if info.get("is_retired") else "no",
            "offers_telehealth": "yes" if info.get("offers_telehealth") else "no",
            "demo_cta": f"{DEMO} (Cal: {CAL})",
            "trial_cta": TRIAL,
            "status": "new",
            "location_label": base.get("location") or "",
        }
        row["score"] = score_row(row)
        rows.append(row)

    rows.sort(key=lambda r: (-r["score"], r["specialty"], r["state"], r["name"]))

    fields = [
        "score",
        "name",
        "title",
        "first_name",
        "last_name",
        "specialty",
        "state",
        "city",
        "phone",
        "whatsapp",
        "landline",
        "email",
        "address",
        "website",
        "private_practice",
        "source",
        "profile_url",
        "healthshare_id",
        "qualifications",
        "is_retired",
        "offers_telehealth",
        "demo_cta",
        "trial_cta",
        "status",
        "location_label",
    ]
    write_csv(OUT / "au-healthshare-leads.csv", rows, fields)

    call_ready = [r for r in rows if r.get("phone")]
    write_csv(OUT / "au-call-ready-leads.csv", call_ready, fields)

    wa_ready = [r for r in rows if r.get("whatsapp")]
    write_csv(OUT / "au-whatsapp-call-ready.csv", wa_ready, fields)

    by_spec = Counter(r["specialty"] for r in rows)
    by_spec_phone = Counter(r["specialty"] for r in call_ready)
    by_spec_wa = Counter(r["specialty"] for r in wa_ready)
    by_state = Counter(r["state"] or "?" for r in rows)

    ozet = {
        "total": len(rows),
        "with_phone": len(call_ready),
        "with_whatsapp_mobile": len(wa_ready),
        "by_specialty": dict(by_spec),
        "by_specialty_with_phone": dict(by_spec_phone),
        "by_specialty_with_mobile": dict(by_spec_wa),
        "by_state": dict(by_state),
        "demo": DEMO,
        "cal": CAL,
        "trial": TRIAL,
        "source": "healthshare",
    }
    ozet["files"] = {
        "full": "au-healthshare-leads.csv",
        "call_ready": "au-call-ready-leads.csv",
        "whatsapp": "au-whatsapp-call-ready.csv",
    }
    (OUT / "au-healthshare-leads.ozet.json").write_text(json.dumps(ozet, indent=2))
    print("\n=== SUMMARY ===")
    print(json.dumps(ozet, indent=2))
    print(f"Wrote {OUT / 'au-healthshare-leads.csv'} ({len(rows)})")
    print(f"Wrote {OUT / 'au-call-ready-leads.csv'} ({len(call_ready)})")
    print(f"Wrote {OUT / 'au-whatsapp-call-ready.csv'} ({len(wa_ready)})")
    print(f"Wrote {OUT / 'au-healthshare-leads.ozet.json'}")

    if args.asdp:
        asdp_rows = asdp_supplement(args.delay)
        write_csv(
            OUT / "au-asdp-paeds-directory.csv",
            asdp_rows,
            [
                "name",
                "specialty",
                "state",
                "phone",
                "whatsapp_candidate",
                "email",
                "website",
                "source",
                "private_practice",
                "note",
            ],
        )
        print(f"Wrote ASDP directory ({len(asdp_rows)})")


if __name__ == "__main__":
    main()
