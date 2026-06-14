from passlib.context import CryptContext

# Define the hashing algorithm (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Checks if the typed password matches the scrambled database password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Takes a raw password and scrambles it securely"""
    return pwd_context.hash(password)