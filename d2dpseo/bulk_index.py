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
LOG_FILE = os.path.join(BASE_DIR, "indexed_log.txt") # Tracks what's done

def get_already_indexed():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, "r") as f:
            return set(f.read().splitlines())
    return set()

def bulk_index():
    # Load credentials
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE)
    service = build('indexing', 'v3', credentials=creds)
    
    already_indexed = get_already_indexed()
    
    # Read URLs from CSV (assuming column header is 'url')
    with open(CSV_FILE, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        urls_to_process = [row['url'] for row in reader if row['url'] not in already_indexed]

    # Slice to only 200 to protect quota 
    batch = urls_to_process[:200]
    
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