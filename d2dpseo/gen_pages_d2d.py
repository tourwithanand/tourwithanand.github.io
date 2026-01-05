import csv
import os

# =========================
# CONFIG
# =========================
TEMPLATE_FILE = "template-d2d.html"
CSV_FILE = "D2DPSEO.csv"
OUTPUT_DIR = "output"
PER_KM_RATE = 15

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
# CREATE OUTPUT FOLDER
# =========================
os.makedirs(OUTPUT_DIR, exist_ok=True)

# =========================
# LOAD TEMPLATE
# =========================
with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
    template = f.read()

# =========================
# READ CSV & GENERATE PAGES
# =========================
with open(CSV_FILE, newline="", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)

    for raw_row in reader:
        row = clean_row(raw_row)

        distance_km = parse_distance(row["distance_km"])
        base_fare = int(distance_km * PER_KM_RATE)

        page = template
        page = page.replace("{{FROM_LOCATION}}", row["from_location"])
        page = page.replace("{{TO_LOCATION}}", row["to_location"])
        page = page.replace("{{FROM_SLUG}}", row["from_slug"])
        page = page.replace("{{TO_SLUG}}", row["to_slug"])
        page = page.replace("{{DISTANCE_KM}}", row["distance_km"])
        page = page.replace("{{TRAVEL_TIME}}", row["travel_time"])
        page = page.replace("{{PER_KM_RATE}}", str(PER_KM_RATE))
        page = page.replace("{{BASE_FARE}}", str(base_fare))

        filename = f"{row['from_slug']}-to-{row['to_slug']}-taxi.html"
        output_path = os.path.join(OUTPUT_DIR, filename)

        with open(output_path, "w", encoding="utf-8") as out:
            out.write(page)

        print(f"✅ Generated: {output_path}")

print("\n🎉 ALL DESTINATION-TO-DESTINATION TAXI PAGES GENERATED SUCCESSFULLY")
