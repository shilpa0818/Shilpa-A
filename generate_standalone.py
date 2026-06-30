import base64
import os

project_dir = r"C:\Users\Administrator\.gemini\antigravity\scratch\resume-analyzer"

logo_path = os.path.join(project_dir, "logo.png")
hero_path = os.path.join(project_dir, "hero.png")
css_path = os.path.join(project_dir, "styles.css")
js_path = os.path.join(project_dir, "app.js")
html_path = os.path.join(project_dir, "index.html")
output_path = os.path.join(project_dir, "standalone.html")

print("Starting standalone HTML compilation...")

# Read assets
try:
    with open(logo_path, "rb") as f:
        logo_b64 = base64.b64encode(f.read()).decode("utf-8")
    print("SUCCESS: Loaded logo image and converted to base64")
except Exception as e:
    print(f"Error loading logo: {e}")
    logo_b64 = ""

try:
    with open(hero_path, "rb") as f:
        hero_b64 = base64.b64encode(f.read()).decode("utf-8")
    print("SUCCESS: Loaded hero image and converted to base64")
except Exception as e:
    print(f"Error loading hero: {e}")
    hero_b64 = ""

with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()
print("SUCCESS: Loaded CSS styles")

with open(js_path, "r", encoding="utf-8") as f:
    js_content = f.read()
print("SUCCESS: Loaded JS logic")

with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()
print("SUCCESS: Loaded base HTML")

# Inline CSS
html_content = html_content.replace('<link rel="stylesheet" href="styles.css">', f'<style>\n{css_content}\n</style>')

# Inline Images as Base64
if logo_b64:
    html_content = html_content.replace('src="logo.png"', f'src="data:image/png;base64,{logo_b64}"')
if hero_b64:
    html_content = html_content.replace('src="hero.png"', f'src="data:image/png;base64,{hero_b64}"')

# Inline JS
html_content = html_content.replace('<script src="app.js"></script>', f'<script>\n{js_content}\n</script>')

# Save Standalone
with open(output_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"SUCCESS: Standalone HTML successfully compiled to: {output_path}")
