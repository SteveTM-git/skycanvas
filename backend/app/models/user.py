from datetime import datetime

class User:
    def __init__(self, id: str, username: str, email: str):
        self.id = id
        self.username = username
        self.email = email
        self.created_at = datetime.now()

class Generation:
    def __init__(self, id: str, user_id: str, sketch_url: str, image_url: str, prompt: str):
        self.id = id
        self.user_id = user_id
        self.sketch_url = sketch_url
        self.image_url = image_url
        self.prompt = prompt
        self.created_at = datetime.now()