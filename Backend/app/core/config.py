import os
from dotenv import load_dotenv
load_dotenv()
SECRET_KEY = os.environ.get('JOB_SECRET_KEY', 'local-dev-only-change-before-deploy')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 120
