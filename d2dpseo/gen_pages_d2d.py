import csv
import os
from datetime import date

# =========================
# PATH & SITEMAP CONFIG (IMPORTANT)
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TEMPLATE_FILE = os.path.join(BASE_DIR, "template-d2d.html")
CSV_FILE = os.path.join(BASE_DIR, "D2DPSEO.csv")

# WRITE FILES TO ROOT FOLDER
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

PER_KM_RATE = 15
BASE_URL = "https://tourwithanand.in"

# Base hub pages to always include in the sitemap
hub_pages = [
    "",
    "/kochi-airport-hospital-taxi.html",
    "/kochi-airport-hotel-taxi.html",
    "/kochi-airport-places-taxi.html",
    "/kochi-airport-tour-destinations-taxi.html",
]

urls = []

# Add homepage + hub pages to urls
for page_uri in hub_pages:
    urls.append(f"{BASE_URL}{page_uri}")

# =========================
# HELPERS
# =========================
def clean_row(row):
    return {k.strip().lower(): v.strip() for k, v in row.items()}

def parse_distance(val):
    try:
        return float(val)
    except:
        return 0

# =========================
# LOAD TEMPLATE
# =========================
with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
    template = f.read()

# =========================
# READ CSV, GENERATE PAGES & COLLECT URLS
# =========================
with open(CSV_FILE, newline="", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)

    for raw_row in reader:
        row = clean_row(raw_row)

        distance_km = parse_distance(row["distance_km"])
        base_fare = int(distance_km * PER_KM_RATE)

        page = template
        
        # STANDARD VARIABLES
        page = page.replace("{{FROM_LOCATION}}", row["from_location"])
        page = page.replace("{{TO_LOCATION}}", row["to_location"])
        page = page.replace("{{FROM_SLUG}}", row["from_slug"])
        page = page.replace("{{TO_SLUG}}", row["to_slug"])
        page = page.replace("{{DISTANCE_KM}}", row["distance_km"])
        page = page.replace("{{TRAVEL_TIME}}", row["travel_time"])
        page = page.replace("{{PER_KM_RATE}}", str(PER_KM_RATE))
        page = page.replace("{{BASE_FARE}}", str(base_fare))

        # =========================
        # NEW SEO VARIABLES (CRITICAL FOR INDEXING)
        # =========================
        page = page.replace("{{ROUTE_TERRAIN}}", row["route_terrain"])
        page = page.replace("{{SUGGESTED_CAR}}", row["suggested_car"])
        page = page.replace("{{WAYPOINTS}}", row["waypoints"])
        page = page.replace("{{UNIQUE_DESC}}", row["unique_desc"])

        # Generate HTML Filename
        filename = f"{row['from_slug']}-to-{row['to_slug']}-taxi.html"
        output_path = os.path.join(OUTPUT_DIR, filename)

        # Write the HTML file
        with open(output_path, "w", encoding="utf-8") as out:
            out.write(page)

        print(f"✅ Generated & replaced: {filename}")
        
        # Append generated page URL to our sitemap list
        page_url = f"{BASE_URL}/{filename}"
        urls.append(page_url)

print("\n🎉 ALL D2D TAXI PAGES GENERATED IN ROOT SUCCESSFULLY")

# =========================
# GENERATE SITEMAP.XML
# =========================
# Remove duplicates and sort alphabetically
urls = sorted(set(urls))

# Fetch today's date automatically for the <lastmod> tag
today_date = date.today().isoformat()

xml = ['<?xml version="1.0" encoding="UTF-8"?>']
xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

for url in urls:
    xml.append("  <url>")
    xml.append(f"    <loc>{url}</loc>")
    xml.append(f"    <lastmod>{today_date}</lastmod>")
    xml.append("    <priority>0.8</priority>")
    xml.append("  </url>")

xml.append("</urlset>")

# Save sitemap.xml in the main root directory (OUTPUT_DIR)
sitemap_path = os.path.join(OUTPUT_DIR, "sitemap.xml")

with open(sitemap_path, "w", encoding="utf-8") as f:
    f.write("\n".join(xml))

print(f"🗺️ Generated sitemap.xml with {len(urls)} URLs successfully!")