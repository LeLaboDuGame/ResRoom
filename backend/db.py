
import threading
import json

class Database:
    def __init__(self, filename):
        self.filename = filename
        self.lock = threading.Lock()
        self.data = None

    def load(self):
        self.data = json.load(open(self.filename, "r"))


    def save(self):
        json.dump(self.data, open(self.filename, "w"))