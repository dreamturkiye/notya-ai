#!/usr/bin/env python3
"""
AU private-practice lead harvest — WhatsApp / mobile enrichment side job.

Sources:
  - ASDP Find-a-Specialist (paediatrics directory, all states) via CSRF session
  - Optional practice-site scrape for contact-labelled 04xx mobiles

Outputs (kept under docs/growth/au/ — never mixed into TR CSVs):
  - docs/growth/au/au-asdp-paeds-directory.csv
  - docs/growth/au/au-harvest-site-mobiles.csv  (when --sites runs)

Classification: GTM / growth ops only. Not product spine.
"""

from __future__ import annotations

import argparse
import csv
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import unquote, urljoin

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "growth" / "au"
UA = "NotyaLeadResearch/1.0 (AU research; hello@notya.io)"
STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"]

MOB_LAB = re.compile(
    r"(?:mobile|mob|whatsapp|phone|ph|tel|call|contact|reception)\s*[:\-]?\s*"
    r"((?:\+?61|0)?4[\d\s\-.]{8,})",
    re.I,
)
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)


def norm_mobile(raw: str) -> str:
    d = re.sub(r"\D", "", raw or "")
    if d.startswith("61"):
        d = d[2:]
    if d.startswith("0"):
        d = d[1:]
    if len(d) == 9 and d.startswith("4"):
        return "+61" + d
    return ""


def session() -> requests.Session:
    s = requests.Session()
    s.headers["User-Agent"] = UA
    return s


def asdp_state(state: str) -> list[dict]:
    s = session()
    g = s.get("https://asdp.au/find-a-specialist", timeout=40)
    tok = re.search(r'name="_token"\s+value="([^"]+)"', g.text)
    if not tok:
        raise RuntimeError(f"ASDP token missing ({state})")
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
    out: list[dict] = []
    for block in re.split(r"<h2[^>]*>", p.text)[1:]:
        m = re.match(r"\s*([^<]+)", block)
        if not m:
            continue
        name = re.sub(r"\s+", " ", m.group(1)).strip()
        if not name.lower().startswith("dr"):
            continue
        phones = [x.strip() for x in re.findall(r"Phone:\s*([^<\n]+)", block)]
        emails = EMAIL_RE.findall(block)
        webs = re.findall(r'Web:\s*<a[^>]+href="([^"]+)"', block)
        mobiles = [norm_mobile(ph) for ph in phones if norm_mobile(ph)]
        out.append(
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
    return out


def strip_html(html: str) -> str:
    t = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    t = re.sub(r"<style[\s\S]*?</style>", " ", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = re.sub(r"&nbsp;", " ", t)
    return re.sub(r"\s+", " ", t)


def scrape_site(url: str) -> dict:
    if not url:
        return {"mobiles": [], "emails": [], "wa_word": False}
    s = session()
    try:
        r = s.get(url, timeout=25, allow_redirects=True)
        pages = [r.text]
        for path in ("/contact", "/contact-us", "/contact/", "/about", "/about-us"):
            try:
                rr = s.get(urljoin(r.url, path), timeout=12)
                if rr.ok and len(rr.text) > 400:
                    pages.append(rr.text)
            except Exception:
                pass
        blob = "\n".join(strip_html(p) for p in pages)
        mobiles: dict[str, str] = {}
        for m in MOB_LAB.finditer(blob):
            n = norm_mobile(m.group(1))
            if n and n not in mobiles:
                mobiles[n] = m.group(0)[:90]
        emails = [
            e
            for e in sorted(set(EMAIL_RE.findall(blob)))
            if "example" not in e and "wixpress" not in e and "sentry" not in e
        ][:4]
        return {
            "mobiles": list(mobiles.items()),
            "emails": emails,
            "wa_word": bool(re.search(r"whatsapp", blob, re.I)),
        }
    except Exception as e:
        return {"mobiles": [], "emails": [], "wa_word": False, "err": str(e)}


DEFAULT_SITES = [
    ("paediatrics", "Dr Vivek Akkera", "NSW", "https://www.medivik.com.au"),
    ("paediatrics", "Dr Philippa Birkin", "NSW", "https://www.drpippa.com.au/"),
    ("paediatrics", "Dr Christopher Ward", "VIC", "https://www.elthampaediatrics.com.au/"),
    ("paediatrics", "Dr Annette Webb", "VIC", "https://www.drannettewebb.com.au/"),
    ("obstetrics-gynaecology", "Dr Sean Burnet", "NSW", "https://www.drseanburnet.com.au/"),
    ("obstetrics-gynaecology", "Sydney Obstetrician", "NSW", "https://www.sydneyobstetrician.com.au/"),
    ("dietetics", "Body Fusion", "NSW", "https://www.bodyfusion.com.au/"),
    ("dietetics", "Appetite for Nutrition", "QLD", "https://www.appetitefornutrition.com.au/"),
    ("dietetics", "Kim Faulkner-Hogg", "NSW", "https://glutenfreenutrition.com.au/"),
    ("dietetics", "Nutritionally Balanced", "NSW", "https://nutritionallybalanced.com.au/contact/"),
    ("dermatology", "Skin by Dermatologists", "ACT", "https://www.skinbyderms.com.au/"),
    ("dermatology", "Dermatology North Sydney", "NSW", "https://www.dermatologynorthsydney.com.au/"),
]


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in fields})


def main() -> None:
    ap = argparse.ArgumentParser(description="Harvest AU private-practice mobiles / ASDP directory")
    ap.add_argument("--skip-asdp", action="store_true")
    ap.add_argument("--sites", action="store_true", help="Also scrape curated practice sites")
    ap.add_argument("--delay", type=float, default=0.4)
    args = ap.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)

    if not args.skip_asdp:
        rows: list[dict] = []
        for st in STATES:
            got = asdp_state(st)
            print(f"ASDP {st}: {len(got)}")
            rows.extend(got)
            time.sleep(args.delay)
        fields = [
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
        ]
        write_csv(OUT / "au-asdp-paeds-directory.csv", rows, fields)
        print(
            f"Wrote {OUT / 'au-asdp-paeds-directory.csv'} "
            f"({len(rows)} rows, {sum(1 for r in rows if r['whatsapp_candidate'])} listing mobiles)"
        )

    if args.sites:
        site_rows: list[dict] = []

        def one(item: tuple[str, str, str, str]) -> dict:
            spec, name, state, url = item
            info = scrape_site(url)
            mobiles = info.get("mobiles") or []
            best = mobiles[0][0] if mobiles else ""
            return {
                "name": name,
                "specialty": spec,
                "state": state,
                "website": url,
                "whatsapp_candidate": best,
                "all_mobiles": ";".join(n for n, _ in mobiles),
                "mobile_snippet": mobiles[0][1] if mobiles else "",
                "email": (info.get("emails") or [""])[0],
                "wa_mentioned": info.get("wa_word"),
                "source": "practice-site",
                "note": info.get("err", ""),
            }

        with ThreadPoolExecutor(max_workers=8) as ex:
            futs = [ex.submit(one, item) for item in DEFAULT_SITES]
            for f in as_completed(futs):
                site_rows.append(f.result())
        site_rows.sort(key=lambda r: (r["specialty"], r["state"], r["name"]))
        fields = [
            "name",
            "specialty",
            "state",
            "website",
            "whatsapp_candidate",
            "all_mobiles",
            "mobile_snippet",
            "email",
            "wa_mentioned",
            "source",
            "note",
        ]
        write_csv(OUT / "au-harvest-site-mobiles.csv", site_rows, fields)
        print(
            f"Wrote {OUT / 'au-harvest-site-mobiles.csv'} "
            f"({sum(1 for r in site_rows if r['whatsapp_candidate'])} with labelled mobile)"
        )


if __name__ == "__main__":
    main()
