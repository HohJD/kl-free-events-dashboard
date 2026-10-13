"""Serve the static export with the same clean URLs used by production."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "dist"

class PreviewHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        target = super().translate_path(path)
        if not Path(target).exists() and Path(target + ".html").is_file():
            return target + ".html"
        return target

if __name__ == "__main__":
    print("Preview: http://127.0.0.1:3100", flush=True)
    ThreadingHTTPServer(("127.0.0.1", 3100), PreviewHandler).serve_forever()
