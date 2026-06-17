import os
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, "credentials.json")

# The single URL you want to index
TARGET_URL = "https://tourwithanand.in/kochi-airport-to-aluva-taxi.html"

def single_index():
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE)
    service = build('indexing', 'v3', credentials=creds)
    
    content = {'url': TARGET_URL, 'type': 'URL_UPDATED'}
    
    try:
        response = service.urlNotifications().publish(body=content).execute()
        print(f"✅ SUCCESS 200: {TARGET_URL} has been submitted!")
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    single_index()