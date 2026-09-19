from app.services.detectors.malicious_code import MaliciousCodeDetector
from app.services.detectors.sql_injection import SqlInjectionDetector
from app.services.detectors.insecure_file_handling import InsecureFileHandlingDetector
from app.services.detectors.auth_missing import AuthMissingDetector
from app.services.detectors.authz_missing import AuthzMissingDetector
from app.services.detectors.secret_exposure import SecretExposureDetector

ALL_DETECTORS = [
    MaliciousCodeDetector(),
    SqlInjectionDetector(),
    InsecureFileHandlingDetector(),
    AuthMissingDetector(),
    AuthzMissingDetector(),
    SecretExposureDetector(),
]
