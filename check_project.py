"""Static sanity checks that do not require running Flask or calling external APIs."""
from pathlib import Path
import ast
import sys

ROOT = Path(__file__).resolve().parent
app_path = ROOT / "app.py"
ast.parse(app_path.read_text(encoding="utf-8"), filename=str(app_path))
required = [
    ROOT / "templates" / "index.html",
    ROOT / "static" / "styles.css",
    ROOT / "static" / "app.js",
    ROOT / "requirements.txt",
    ROOT / "SUBMISSION_DRAFT.md",
    ROOT / "render.yaml",
]
missing = [str(path.relative_to(ROOT)) for path in required if not path.exists()]
if missing:
    print("Missing project files:", ", ".join(missing))
    sys.exit(1)
js = (ROOT / "static" / "app.js").read_text(encoding="utf-8")
if "google/gemma-4-26b-a4b-it:free" not in js:
    print("Gemma 4 recommended model is not configured in the frontend.")
    sys.exit(1)
print("Static project checks passed. This does not test live API connectivity or a browser run.")
