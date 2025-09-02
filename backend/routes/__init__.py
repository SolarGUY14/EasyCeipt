# Routes package for EasyCeipt API

# Convenience imports - only keep useful routes
from .receipts import receipts_bp

# List of all blueprints for easy registration
__all__ = ['receipts_bp']

# Package metadata
__version__ = '1.0.0'
__author__ = 'EasyCeipt Team' 