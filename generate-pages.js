#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Configuration
const CSV_FILE = './routes.csv';
const TEMPLATE_FILE = './template.html';
const OUTPUT_DIR = './';

// Helper function to slugify text
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to replace placeholders
function replacePlaceholders(template, data) {
  let result = template;

  // Replace simple placeholders {{Key}}
  Object.keys(data).forEach((key) => {
    const placeholder = `{{${key}}}`;
    const value = data[key] || '';
    result = result.split(placeholder).join(value);
  });

  // Handle special array cases like {{#InternalLinks}}
  // For internal links, split by comma and create links
  if (data['Internal Links']) {
    const internalLinks = data['Internal Links']
      .split(',')
      .map((link) => link.trim())
      .filter((link) => link && link !== '')
      .map((link) => {
        const href = link.startsWith('http')
          ? link
          : `${link}.html`;
        const text = link.replace(/^\/|\/$/g, '').replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        return `<a href="${href}" class="px-6 py-3 bg-white text-orange-600 border border-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition shadow-sm">${text}</a>`;
      })
      .join('\n                ');

    result = result.replace(
      /{{#InternalLinks}}[\s\S]*?{{\/InternalLinks}}/,
      internalLinks
    );
  }

  // Handle places to visit bullets
  if (data['Places to Visit Bullet List']) {
    const places = data['Places to Visit Bullet List']
      .split(',')
      .map((place) => place.trim())
      .filter((place) => place)
      .map((place) => `<li>${place}</li>`)
      .join('\n                        ');

    result = result.replace(
      /{{#PlacesToVisitBullets}}[\s\S]*?{{\/PlacesToVisitBullets}}/,
      places
    );
  }

  return result;
}

// Main function
async function generatePages() {
  try {
    // Read CSV file
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const records = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Read template
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

    console.log(`Found ${records.length} routes to generate...`);

    // Generate a page for each record
    records.forEach((record, index) => {
      const slug = record.Slug || slugify(record['Primary Keyword']);
      const filename = `${slug}.html`;
      const filepath = path.join(OUTPUT_DIR, filename);

      // Replace placeholders with CSV data
      const html = replacePlaceholders(template, record);

      // Write file
      fs.writeFileSync(filepath, html, 'utf-8');
      console.log(`✓ Generated: ${filename}`);
    });

    console.log(`\n✓ Successfully generated ${records.length} page(s)!`);
  } catch (error) {
    console.error('Error generating pages:', error.message);
    process.exit(1);
  }
}

// Run the script
generatePages();
