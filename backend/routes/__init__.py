# Routes package for EasyCeipt API

# Convenience imports - makes it easier to import routes
from .auth import auth_bp
from .receipts import receipts_bp

# List of all blueprints for easy registration
__all__ = ['auth_bp', 'receipts_bp']

# Package metadata
__version__ = '1.0.0'
__author__ = 'EasyCeipt Team' 