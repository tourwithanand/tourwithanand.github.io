# Tour With Anand - Page Generator

Automated HTML page generation system for taxi service routes using CSV data and HTML templates.

## Files Overview

- **`template.html`** - Master HTML template with placeholders for all CSV columns
- **`generate-pages.js`** - Node.js script that reads CSV and generates individual HTML pages
- **`routes.csv`** - CSV file containing route data (columns map to template placeholders)
- **`package.json`** - Node.js project configuration with dependencies

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs the `csv-parse` package needed to read and parse CSV files.

### 2. Add Your Routes to CSV

Edit `routes.csv` and add rows with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Primary Keyword | Main search keyword | "kochi airport to fort kochi taxi" |
| Slug | URL-friendly identifier | "kochi-airport-to-fort-kochi-taxi" |
| Distance | Route distance | "44 km" |
| Travel Time | Estimated travel time | "1.3 hours" |
| Page Title (H1) | Main heading | "Book Kochi Airport to Fort Kochi Taxi" |
| Meta Title | SEO page title | "Kochi Airport to Fort Kochi Taxi \| Fixed Price Cab" |
| Meta Description | SEO meta description | "Book Kochi Airport to Fort Kochi taxi at best fixed fare with 24×7 pickup." |
| Phone Number | Contact number | "+919400620615" |
| One-Way Fare 1 | Fare for vehicle 1 | "1299" |
| Round-Trip Fare 1 | Round trip for vehicle 1 | "2300" |
| One-Way Fare 2 | Fare for vehicle 2 | "1800" |
| Round-Trip Fare 2 | Round trip for vehicle 2 | "3200" |
| Vehicle Type 1 | First vehicle name | "Sedan" |
| Model 1 | Vehicle 1 models | "Etios/Dzire" |
| Capacity 1 | Vehicle 1 seats | "4" |
| Vehicle Type 2 | Second vehicle name | "SUV" |
| Model 2 | Vehicle 2 models | "Ertiga" |
| Capacity 2 | Vehicle 2 seats | "6" |
| Local Area | Destination area | "Fort Kochi" |
| District | District name | "Ernakulam" |
| State | State name | "Kerala" |
| Primary Image URL | Hero image URL | "https://tourwithanand.in/images/fort-kochi.jpg" |
| Image Alt Text | Image alt text | "Kochi Airport to Fort Kochi Taxi Service" |
| Route Title (H2) | Route section heading | "Kochi Airport to Fort Kochi Route" |
| Route Description | Route details paragraph | "The route is smooth and well connected through NH 544..." |
| Places to Visit Title (H2) | Places heading | "Places to Visit in Fort Kochi" |
| Places to Visit Bullet List | Comma-separated places | "Chinese Fishing Nets, Dutch Cemetery, Mattancherry Palace" |
| FAQ Title (H2) | FAQ section heading | "Frequently Asked Questions" |
| FAQ 1 Question | First FAQ question | "What is the distance?" |
| FAQ 1 Answer | First FAQ answer | "44 km" |
| FAQ 2 Question | Second FAQ question | "How long is the travel time?" |
| FAQ 2 Answer | Second FAQ answer | "About 1.3 hours" |
| FAQ 3 Question | Third FAQ question | "What is the taxi fare?" |
| FAQ 3 Answer | Third FAQ answer | "₹1299 onwards" |
| FAQ 4 Question | Fourth FAQ question | "Is 24×7 pickup available?" |
| FAQ 4 Answer | Fourth FAQ answer | "Yes, always available" |
| FAQ 5 Question | Fifth FAQ question | "Do you offer SUV and Sedan options?" |
| FAQ 5 Answer | Fifth FAQ answer | "Yes, multiple vehicle types available." |
| Internal Links | Comma-separated internal links | "/kochi-airport-to-alleppey-taxi/, /kochi-airport-to-munnar-taxi/" |
| WhatsApp Link | WhatsApp contact link | "https://wa.me/919400620615?text=Hi+Anand,+I+need+a+taxi+from+Kochi+Airport+to+Fort+Kochi" |
| Taxi Service Title (H2) | Service section heading | "Kochi Airport to Fort Kochi Taxi Services" |
| Taxi Service Description Paragraph | Service description | "Tour With Anand provides flexible car options..." |
| Schema Description | Schema.org description | "Taxi service from Kochi Airport to Fort Kochi with fixed pricing." |

### 3. Generate Pages

Run the generation script:

```bash
npm run generate
```

The script will:
- Read all rows from `routes.csv`
- Replace template placeholders with CSV data
- Generate individual HTML files named after the `Slug` column
- Create files in the current directory

### 4. Output

After running the script, you'll have:
- `kochi-airport-to-fort-kochi-taxi.html` (from the CSV example)
- Any other `.html` files based on additional CSV rows

## Template Placeholders

All placeholders in `template.html` follow the pattern `{{Column Name}}` and are automatically replaced with corresponding CSV values.

### Special Handling

- **Internal Links**: Comma-separated values are automatically converted to HTML links with proper formatting
- **Places to Visit**: Comma-separated values are converted to bullet list items
- **Numbers**: Used directly as-is (no formatting applied)

## Example Workflow

1. **Add new route to CSV:**
   ```csv
   Primary Keyword,Slug,Distance,Travel Time,...
   kochi airport to munnar taxi,kochi-airport-to-munnar-taxi,120 km,3 hours,...
   ```

2. **Run generator:**
   ```bash
   npm run generate
   ```

3. **Generated file:**
   ```
   ✓ Generated: kochi-airport-to-munnar-taxi.html
   ```

4. **Deploy:**
   - Commit new HTML files to your repository
   - Push to GitHub Pages

## Troubleshooting

**Issue: Script says "csv-parse" not found**
```bash
npm install
```

**Issue: Generated page has empty placeholders**
- Check that the CSV column name exactly matches the placeholder in the template
- Ensure the CSV is properly formatted with no missing columns

**Issue: Special characters not displaying correctly**
- Ensure your CSV file is saved with UTF-8 encoding
- Check that meta description and other fields don't contain unescaped quotes

## Tips

- Use a CSV editor or Google Sheets to manage your routes data
- Test generated pages in a browser before deploying
- Keep your template and CSV columns synchronized
- Use relative URLs for internal links in the "Internal Links" column (e.g., `/route-name-taxi/` or `route-name-taxi.html`)

## License

MIT
