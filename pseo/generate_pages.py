import csv
import os

# =========================
# FILE CONFIG
# =========================
TEMPLATE_FILE = "template.html"
CSV_FILE = "destinations.csv"
OUTPUT_DIR = "output"

# =========================
# CLEAN CSV ROW KEYS
# =========================
def clean_row(row):
    return {
        k.strip().lower().replace("\ufeff", ""): v
        for k, v in row.items()
    }

# =========================
# CREATE OUTPUT FOLDER
# =========================
if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

# =========================
# LOAD HTML TEMPLATE
# =========================
with open(TEMPLATE_FILE, "r", encoding="utf-8") as file:
    template = file.read()

# =========================
# READ CSV & GENERATE PAGES
# =========================
with open(CSV_FILE, newline="", encoding="utf-8") as csvfile:
    reader = csv.DictReader(csvfile)

    for raw_row in reader:
        row = clean_row(raw_row)
        page = template

        page = page.replace("{{DESTINATION}}", row["destination"])
        page = page.replace("{{DESTINATION_SLUG}}", row["slug"])
        page = page.replace("{{DISTANCE_KM}}", row["distance_km"])
        page = page.replace("{{TRAVEL_TIME}}", row["time"])
        page = page.replace("{{SEDAN_FARE}}", row["sedan"])
        page = page.replace("{{ERTIGA_FARE}}", row["ertiga"])
        page = page.replace("{{INNOVA_FARE}}", row["innova"])
        page = page.replace("{{CRYSTA_FARE}}", row["crysta"])

        filename = f"kochi-airport-to-{row['slug']}-taxi.html"
        output_path = os.path.join(OUTPUT_DIR, filename)

        with open(output_path, "w", encoding="utf-8") as output_file:
            output_file.write(page)

        print(f"Generated: {output_path}")

print("\n✅ ALL DESTINATION PAGES GENERATED SUCCESSFULLY")
