import os
import json
import threading
from firebase_admin import credentials, firestore, storage, initialize_app
from datetime import datetime
from google.api_core.datetime_helpers import DatetimeWithNanoseconds

cred = credentials.Certificate('creds.json')
bucket = os.environ['STORAGE_BUCKET'] if 'STORAGE_BUCKET' in os.environ else 'red-coral-map.appspot.com'
initialize_app(cred, {
    'storageBucket': bucket
})
db = firestore.client()
bucket = storage.bucket()

timestamp = DatetimeWithNanoseconds.fromisoformat(datetime.now().isoformat())

to_remove = []

def minify_json(data):
    return json.dumps(data, separators=(',', ':'))

def read_firestore():
    categories = {} # hi
    types = {}
    incidents = {}

    out = {
        "readAt": timestamp.isoformat()
    }

    for d, collection_name in [(categories, 'Categories'), (types, 'Types'), (incidents, 'Incidents')]:
        for doc in db.collection(collection_name).stream():
            d[doc.id] = doc.to_dict()
            if d[doc.id].get('deleted', False):
                to_remove.append((collection_name, doc.id))
                del d[doc.id]
                continue
            if 'updatedAt' in d[doc.id]:
                del d[doc.id]['updatedAt'] # not serializable and it's not needed
        out[collection_name] = d

    return out

def save_to_cloud_storage(data):
    minified_data = minify_json(data)

    with open('state.json', 'w') as file:
        file.write(minified_data)

    blob = bucket.blob('state.json')
    blob.content_disposition = 'attachment; filename="state.json"'
    blob.upload_from_filename('state.json')

def main():
    data = read_firestore()
    save_to_cloud_storage(data)

    # Remove deleted documents
    for collection_name, doc_id in to_remove:
        db.collection(collection_name).document(doc_id).delete()

main()
