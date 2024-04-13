import os
import json
import threading
from firebase_admin import credentials, firestore, storage, initialize_app
from google.cloud import storage as gcs
from datetime import datetime

cred = credentials.Certificate('creds.json')
initialize_app(cred, {
    'storageBucket': 'red-coral-map.appspot.com'
})
db = firestore.client()
bucket = storage.bucket()

utc_time = datetime.utcnow()
timestamp = utc_time.timestamp()

def minify_json(data):
    return json.dumps(data, separators=(',', ':'))

def read_firestore():
    categories = {}
    types = {}
    incidents = {}

    for doc in db.collection('Categories').stream():
        categories[doc.id] = doc.to_dict()

    for doc in db.collection('Types').stream():
        types[doc.id] = doc.to_dict()

    for doc in db.collection('Incidents').stream():
        incidents[doc.id] = doc.to_dict()

    return {
        'Categories': categories,
        'Types': types,
        'Incidents': incidents
    }

def save_to_cloud_storage(data):
    minified_data = minify_json(data)

    with open('data.json', 'w') as file:
        file.write(minified_data)

    blob = bucket.blob('data.json')
    blob.upload_from_filename('data.json')

def update_firestore_with_timestamp(collection_name, doc_id):
    db.collection(collection_name).document(doc_id).update({'readAt': timestamp})

def update_documents_concurrently(collection_name, doc_ids):
    threads = []
    for doc_id in doc_ids:
        thread = threading.Thread(target=update_firestore_with_timestamp, args=(collection_name, doc_id))
        threads.append(thread)
        thread.start()
    for thread in threads:
        thread.join()

def main():
    data = read_firestore()
    save_to_cloud_storage(data)

    # Update documents in Firestore with readAt timestamp concurrently
    for collection_name, doc_ids in data.items():
        update_documents_concurrently(collection_name, doc_ids.keys())

if __name__ == "__main__":
    main()
