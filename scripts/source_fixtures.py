"""The sole compiled binary allowed in source archives is a pinned audit fixture."""
import hashlib

HISTORICAL_FIXTURES = {'tests/fixtures/historical-preview/Dynamic-1.0.1.pbw': '94d68f69ead6131c00a3509140be542c257f4c52a19fd27aacc4f6311b7f7a41'}

def source_pbw_allowed(path, content):
    expected = HISTORICAL_FIXTURES.get(path)
    if expected is None:
        return False
    if hashlib.sha256(content).hexdigest() != expected:
        raise ValueError('Historical source fixture hash differs: ' + path)
    return True
