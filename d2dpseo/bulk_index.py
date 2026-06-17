import csv
import json
import os
import time
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")
CSV_FILE = os.path.join(BASE_DIR, "to_index.csv")
LOG_FILE = os.path.join(BASE_DIR, "indexed_log.txt") # Tracks successfully indexed URLs
BASE_URL = "https://tourwithanand.in" # Added base URL for construction

def get_already_indexed():
    """Reads the log file to see which URLs have already been processed."""
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            return set(f.read().splitlines())
    return set()

def bulk_index():
    # Load credentials
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE)
    service = build('indexing', 'v3', credentials=creds)
    
    already_indexed = get_already_indexed()
    urls_to_process = []
    
    # Read URLs from CSV by constructing them from from_slug and to_slug
    try:
        with open(CSV_FILE, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Dynamically build the URL exactly like your page generator does
                constructed_url = f"{BASE_URL}/{row['from_slug']}-to-{row['to_slug']}-taxi.html"
                
                # Filter out URLs already in the log
                if constructed_url not in already_indexed:
                    urls_to_process.append(constructed_url)
    except KeyError as e:
        print(f"❌ Error: Your CSV is missing a required column. Make sure it has {e}")
        return

    # Slice to only 10 to test a small batch
    batch = urls_to_process[:10]
    
    if not batch:
        print("✅ All URLs in your CSV have already been processed or the list is empty.")
        return
    
    print(f"🚀 Starting submission of {len(batch)} URLs...")

    for url in batch:
        content = {'url': url, 'type': 'URL_UPDATED'}
        try:
            response = service.urlNotifications().publish(body=content).execute()
            print(f"✅ SUCCESS 200: {url}")
            # Log success to skip in future
            with open(LOG_FILE, "a") as f:
                f.write(url + "\n")
        except Exception as e:
            print(f"❌ ERROR: Could not index {url}. {e}")
            break # Stop if we hit a hard error like 429
        
        time.sleep(0.5) # Slight delay for API stability

if __name__ == "__main__":
    bulk_index()