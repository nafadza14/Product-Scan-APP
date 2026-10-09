"""
End-to-end QA for VitalSense.

Runs the built app (vite preview on :4173) in headless Chromium with:
  - a fake camera that shows a product label (qa/assets/label.png)
  - Supabase auth + REST mocked in-process
  - AI endpoint /api/chat mocked in-process (success, not recognized, network failure)

Usage:
  npm run build && npx vite preview --port 4173 &
  python3 qa/e2e.py
Screenshots land in qa/out/.
"""
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, expect, Route

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
CACHE = ROOT / ".cache"
OUT.mkdir(exist_ok=True)
for _f in OUT.glob("*.png"):
    _f.unlink()
CACHE.mkdir(exist_ok=True)
URL = os.environ.get("QA_URL", "http://localhost:4173/")

Y4M = CACHE / "label.y4m"
if not Y4M.exists():
    subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-y", "-loop", "1", "-i", str(ROOT / "assets/label.png"),
         "-t", "2", "-r", "10", "-pix_fmt", "yuv420p", str(Y4M)],
        check=True,
    )

USER_ID = "11111111-2222-3333-4444-555555555555"

state = {
    "profile": None,  # set when the app upserts
    "scans": [],
    "gemini": "ok",  # ok | not_recognized | network
    "requests": [],
    "hold": False,
    "feed_queries": [],
    "cloud_skin": {},
    "cloud_logs": {},
    "cloud_settings": None,
    "cloud_photos": {},
    "last_ai_body": "",
    "held": [],
}

PRODUCT = {
    "recognized": True,
    "productName": "Honey Oat Granola",
    "category": "Food",
    "icon": "🥣",
    "status": "CAUTION",
    "score": 46,
    "nutriScore": "D",
    "explanation": "This granola is high in added sugar, which matters during pregnancy because it raises the risk of blood sugar spikes. The oats and almonds add fiber and protein, so a small portion with plain yogurt is a better fit.",
    "fullIngredientList": "Rolled oats (52%), sugar, glucose syrup, sunflower oil, honey (4%), almonds (3%), rice flour, salt, natural flavouring, antioxidant (tocopherols).",
    "ingredients": [
        {"name": "Sugar", "riskLevel": "High Risk", "description": "Second ingredient by weight. Adds up quickly with the glucose syrup and honey."},
        {"name": "Glucose syrup", "riskLevel": "Moderate", "description": "A fast-acting sugar that raises blood glucose."},
        {"name": "Rolled oats", "riskLevel": "Safe", "description": "Whole grain with soluble fiber."},
    ],
    "nutritionAdvisor": [
        {"name": "Fat", "value": "15 g", "level": "Medium"},
        {"name": "Saturated Fat", "value": "1.8 g", "level": "Low"},
        {"name": "Sugar", "value": "22 g", "level": "High"},
        {"name": "Salt", "value": "0.4 g", "level": "Low"},
        {"name": "Protein", "value": "9 g", "level": "Medium"},
    ],
    "dietarySuitability": {"vegan": False, "vegetarian": True, "glutenFree": False, "lactoseFree": True},
    "alternatives": [
        {"name": "Plain rolled oats with berries", "reason": "Same fiber, no added sugar. Sweeten with fruit."},
        {"name": "Unsweetened muesli", "reason": "Crunchy texture with far less sugar per serving."},
    ],
}

SKIN = {
    "faceDetected": True,
    "quality": {"lighting": "good", "sharp": True, "frontal": True, "confidence": 86},
    "skinType": "Combination",
    "skinScore": 72,
    "metrics": {"moisture": 76, "firmness": 87, "texture": 58, "poreVisibility": 63, "evenness": 71},
    "zones": [
        {"zone": "forehead", "score": 70, "note": "A few small closed comedones near the hairline."},
        {"zone": "tzone", "score": 55, "note": "Visible pores and some shine on the nose."},
        {"zone": "leftCheek", "score": 80, "note": "Even and calm, slightly dry along the cheekbone."},
        {"zone": "rightCheek", "score": 78, "note": "Similar to the left side, a little dry."},
        {"zone": "chin", "score": 62, "note": "Two small red bumps along the jawline."},
        {"zone": "underEye", "score": 68, "note": "Mild shadowing under both eyes."},
    ],
    "concernDetails": [
        {"id": "breakouts", "severity": 1, "zones": ["chin", "forehead"], "note": "A few small bumps on the chin and near the hairline."},
        {"id": "enlargedPores", "severity": 2, "zones": ["tzone"], "note": "Pores on the nose look larger than on the cheeks."},
        {"id": "darkSpots", "severity": 1, "zones": ["leftCheek"], "note": "Faint marks where past breakouts healed."},
        {"id": "redness", "severity": 0, "zones": [], "note": ""},
    ],
    "concerns": ["Visible pores", "Mild breakouts", "Dry cheeks"],
    "topPriority": "Add a gentle niacinamide serum to the T-zone in the evening to calm oil and refine pores.",
    "summary": "Your skin looks well hydrated overall, with some congestion around the nose and a few uneven patches. Gentle exfoliation and daily sunscreen will help most.",
    "routine": [
        {"time": "am", "step": "Gentle cleanser", "ingredient": "", "tip": "Use a low-foam cleanser so cheeks stay comfortable."},
        {"time": "am", "step": "Niacinamide serum", "ingredient": "Niacinamide", "tip": "Helps with oil and visible pores on the T-zone."},
        {"time": "am", "step": "Sunscreen SPF 30+", "ingredient": "Zinc oxide", "tip": "Every morning, even when it is cloudy."},
        {"time": "pm", "step": "Cleanser", "ingredient": "", "tip": "Remove sunscreen thoroughly."},
        {"time": "pm", "step": "Azelaic acid", "ingredient": "Azelaic acid", "tip": "Thin layer on the chin and marks, three nights a week."},
        {"time": "pm", "step": "Moisturizer", "ingredient": "Ceramides", "tip": "A light gel cream keeps cheeks comfortable."},
    ],
    "lookFor": ["Niacinamide", "Azelaic acid", "Ceramides", "Zinc oxide"],
    "avoid": ["Retinol", "High-dose salicylic acid", "Hydroquinone"],
}


def ai_route(route: Route):
    if route.request.method == "GET":
        return route.fulfill(status=200, content_type="application/json", body=json.dumps({"configured": True, "model": "gemini/gemini-3.1-flash-lite"}))
    body = route.request.post_data or ""
    state["last_ai_body"] = body
    state["requests"].append(("gemini", body[:200]))
    if state["gemini"] == "network":
        return route.abort("internetdisconnected")
    if state["gemini"] == "not_recognized":
        payload = {"recognized": False, "productName": "", "category": "Other", "status": "CAUTION", "score": 0, "explanation": "", "ingredients": [], "alternatives": []}
    elif "selfie" in body:
        payload = SKIN
    else:
        payload = PRODUCT
    if state.get("hold"):
        state["held"].append(route)  # left pending so the analyzing UI can be captured
        return
    route.fulfill(
        status=200,
        content_type="application/json",
        body=json.dumps({"id": "chatcmpl-qa", "object": "chat.completion", "choices": [{"index": 0, "message": {"role": "assistant", "content": "<think>checking</think>\n```json\n" + json.dumps(payload) + "\n```"}, "finish_reason": "stop"}]}),
    )


def session_json():
    now = int(time.time())
    return {
        "access_token": "header.eyJzdWIiOiIxMTExIn0.sig",
        "token_type": "bearer",
        "expires_in": 3600,
        "expires_at": now + 3600,
        "refresh_token": "refresh-token",
        "user": {
            "id": USER_ID,
            "aud": "authenticated",
            "role": "authenticated",
            "email": "sarah@example.com",
            "app_metadata": {"provider": "email"},
            "user_metadata": {"full_name": "Sarah Putri"},
            "created_at": "2026-01-01T00:00:00Z",
        },
    }


def supabase_route(route: Route):
    req = route.request
    url = req.url
    state["requests"].append((req.method, url.split("supabase.co")[1][:80]))
    if "/auth/v1/signup" in url:
        return route.fulfill(status=200, content_type="application/json", body=json.dumps({"id": "new-user", "email": "new@example.com", "user_metadata": {"full_name": "New Person"}, "aud": "authenticated", "role": "", "created_at": "2026-01-01T00:00:00Z", "identities": [{"id": "x"}]}))
    if "/auth/v1/token" in url:
        body = json.loads(req.post_data or "{}")
        if body.get("password") == "wrong-password":
            return route.fulfill(status=400, content_type="application/json", body=json.dumps({"error": "invalid_grant", "error_description": "Invalid login credentials", "code": "invalid_credentials", "msg": "Invalid login credentials"}))
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(session_json()))
    if "/auth/v1/logout" in url:
        return route.fulfill(status=204, body="")
    if "/auth/v1/user" in url:
        return route.fulfill(status=200, content_type="application/json", body=json.dumps(session_json()["user"]))
    if "/rest/v1/profiles" in url:
        if req.method == "GET":
            if state["profile"] is None:
                return route.fulfill(status=406, content_type="application/json", body=json.dumps({"code": "PGRST116", "message": "JSON object requested, multiple (or no) rows returned", "details": "The result contains 0 rows"}))
            return route.fulfill(status=200, content_type="application/vnd.pgrst.object+json", body=json.dumps(state["profile"]))
        state["profile"] = json.loads(req.post_data or "{}")
        return route.fulfill(status=201, body="")
    if "/rest/v1/scans" in url:
        if req.method == "GET":
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(state["scans"]))
        row = json.loads(req.post_data or "{}")
        row = row[0] if isinstance(row, list) else row
        row["created_at"] = "2026-10-09T00:00:00Z"
        state["scans"].insert(0, row)
        return route.fulfill(status=201, body="")
    # ---- cloud diary tables ----
    def rows_from(body):
        data = json.loads(body or "{}")
        return data if isinstance(data, list) else [data]
    if "/rest/v1/skin_checks" in url:
        if req.method == "GET":
            out = sorted(state["cloud_skin"].values(), key=lambda r: -r["taken_at"])
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(out))
        for r in rows_from(req.post_data):
            state["cloud_skin"][r["id"]] = r
        return route.fulfill(status=201, body="")
    if "/rest/v1/diary_logs" in url:
        if req.method == "GET":
            return route.fulfill(status=200, content_type="application/json", body=json.dumps(list(state["cloud_logs"].values())))
        for r in rows_from(req.post_data):
            state["cloud_logs"][r["day"]] = r
        return route.fulfill(status=201, body="")
    if "/rest/v1/user_settings" in url:
        if req.method == "GET":
            row = state["cloud_settings"]
            accept = req.headers.get("accept", "")
            if "vnd.pgrst.object" in accept:
                if row is None:
                    return route.fulfill(status=406, content_type="application/json", body=json.dumps({"code": "PGRST116", "message": "JSON object requested, multiple (or no) rows returned", "details": "The result contains 0 rows"}))
                return route.fulfill(status=200, content_type="application/vnd.pgrst.object+json", body=json.dumps(row))
            return route.fulfill(status=200, content_type="application/json", body=json.dumps([row] if row else []))
        state["cloud_settings"] = rows_from(req.post_data)[0]
        return route.fulfill(status=201, body="")
    if "/storage/v1/object/skin-photos/" in url:
        path = url.split("/storage/v1/object/skin-photos/")[1].split("?")[0]
        if req.method in ("POST", "PUT"):
            raw = req.post_data_buffer or b""
            # supabase-js sends Blobs as multipart form data; keep just the JPEG bytes.
            start, end = raw.find(b"\xff\xd8"), raw.rfind(b"\xff\xd9")
            state["cloud_photos"][path] = raw[start:end + 2] if start >= 0 and end > start else raw
            return route.fulfill(status=200, content_type="application/json", body=json.dumps({"Key": f"skin-photos/{path}"}))
        data = state["cloud_photos"].get(path)
        if data is None:
            return route.fulfill(status=404, content_type="application/json", body=json.dumps({"error": "not_found"}))
        return route.fulfill(status=200, content_type="image/jpeg", body=data)
    route.fulfill(status=404, body="")


PLACEHOLDER = (ROOT / "assets/placeholder.jpg").read_bytes()
results = []
_page = None


def check(name, fn):
    try:
        fn()
        results.append((name, "PASS", ""))
        print(f"PASS  {name}")
    except Exception as e:  # noqa: BLE001
        results.append((name, "FAIL", str(e).splitlines()[0][:220]))
        print(f"FAIL  {name}: {e}")
        try:
            _page.screenshot(path=str(OUT / f"fail-{len(results):02d}.png"))
            print("      url:", _page.url, "history:", _page.evaluate("JSON.stringify(history.state)+' len '+history.length"))
        except Exception:
            pass


def scroll_main_bottom(page):
    page.evaluate("[...document.querySelectorAll('main')].map(m => { m.scrollTo(0, m.scrollHeight); return [m.scrollHeight, m.clientHeight, m.scrollTop]; })")
    page.wait_for_timeout(300)


def shot(page, name):
    page.wait_for_timeout(450)
    page.screenshot(path=str(OUT / f"{name}.png"))


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            args=[
                "--use-fake-device-for-media-stream",
                "--use-fake-ui-for-media-stream",
                f"--use-file-for-fake-video-capture={Y4M}",
            ]
        )
        ctx = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
            locale="en-US",
            permissions=["camera"],
        )
        ctx.route(re.compile(r".*supabase\.co/.*"), supabase_route)
        ctx.route(re.compile(r".*/api/chat$"), ai_route)
        FEED = (ROOT / "fixtures/feed-pregnancy.json").read_text()
        def feed_route(route):
            state["feed_queries"].append(route.request.url.split("?", 1)[-1])
            route.fulfill(status=200, content_type="application/json", body=FEED)
        ctx.route(re.compile(r".*/api/feed\?.*"), feed_route)
        ctx.route(re.compile(r".*images\.unsplash\.com/.*"), lambda r: r.fulfill(status=200, content_type="image/jpeg", body=PLACEHOLDER))

        page = ctx.new_page()
        global _page
        _page = page
        console_errors = []
        page.on("console", lambda m: m.type == "error" and console_errors.append(m.text))
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        page.goto(URL)
        page.wait_for_load_state("networkidle")

        # ---------- Guest ----------
        def guest_home():
            expect(page.get_by_role("heading", name=re.compile("Hi there"))).to_be_visible()
            expect(page.get_by_text("Sign in to start scanning")).to_be_visible()
            shot(page, "01-home-guest")
        check("Guest home renders", guest_home)

        def guest_scan_opens_auth():
            page.get_by_text("Sign in to start scanning").click()
            expect(page.get_by_role("heading", name="Create your account")).to_be_visible()
            shot(page, "02-auth-signup")
        check("Guest tapping scan opens sign up", guest_scan_opens_auth)

        def signup_confirmation():
            page.get_by_label("Full name").fill("New Person")
            page.get_by_label("Email").fill("new@example.com")
            page.get_by_label("Password", exact=True).fill("secret123")
            page.get_by_role("button", name="Create account").click()
            expect(page.get_by_role("heading", name="Check your inbox")).to_be_visible()
            shot(page, "03-auth-check-email")
            page.get_by_role("button", name="Done").click()
            page.wait_for_timeout(600)
        check("Sign up shows email confirmation state", signup_confirmation)

        def guest_language():
            page.get_by_role("button", name="Profile").last.click()
            expect(page.get_by_role("heading", name="Make every scan personal")).to_be_visible()
            page.get_by_role("button", name=re.compile("Language")).click()
            page.get_by_role("radio", name=re.compile("Bahasa Indonesia")).click()
            expect(page.get_by_role("heading", name="Profil")).to_be_visible(timeout=4000)
            shot(page, "04-profile-guest-id")
            page.get_by_role("button", name=re.compile("Bahasa")).click()
            page.get_by_role("radio", name=re.compile("English")).click()
            expect(page.get_by_role("heading", name="Profile")).to_be_visible(timeout=4000)
        check("Language switch works for guests (EN to ID and back)", guest_language)

        def wrong_password():
            page.get_by_role("button", name="Sign in").click()
            expect(page.get_by_role("heading", name="Welcome back")).to_be_visible()
            page.get_by_label("Email").fill("sarah@example.com")
            page.get_by_label("Password", exact=True).fill("wrong-password")
            page.locator("form").get_by_role("button", name="Sign in").click()
            expect(page.get_by_role("alert")).to_contain_text("Invalid login credentials")
            shot(page, "05-auth-error")
        check("Wrong password shows inline error", wrong_password)

        # ---------- Sign in + onboarding ----------
        def sign_in_and_onboard():
            page.get_by_label("Password", exact=True).fill("secret123")
            page.locator("form").get_by_role("button", name="Sign in").click()
            expect(page.get_by_text("What should we watch for?")).to_be_visible(timeout=6000)
            name = page.get_by_placeholder("For example, Sarah")
            expect(name).to_have_value("Sarah Putri")
            shot(page, "06-onboarding-1")
            page.get_by_role("radio", name=re.compile("Pregnancy")).click()
            page.get_by_role("button", name="Continue").click()
            page.get_by_role("checkbox", name="2nd Trimester").click()
            page.get_by_role("checkbox", name="Gestational Diabetes").click()
            shot(page, "07-onboarding-2")
            page.get_by_role("button", name="Continue").click()
            page.get_by_role("button", name="Nausea").click()
            shot(page, "08-onboarding-3")
            page.get_by_role("button", name="Finish").click()
            expect(page.get_by_role("heading", name=re.compile("Hi Sarah"))).to_be_visible(timeout=5000)
            assert state["profile"] and state["profile"]["condition"] == "Pregnancy", state["profile"]
            assert state["profile"]["name"] == "Sarah Putri"
            assert set(state["profile"]["additional_context"]) == {"2nd Trimester", "Gestational Diabetes"}
            assert state["profile"]["current_symptoms"] == ["Nausea"]
            shot(page, "09-home-signed-in-empty")
        check("Sign in, onboarding saves profile with real name", sign_in_and_onboard)

        # ---------- Product scan ----------
        def product_scan():
            page.get_by_text("Scan a product").click()
            shutter = page.get_by_role("button", name="Take photo")
            expect(shutter).to_be_enabled(timeout=6000)
            page.wait_for_timeout(900)
            shot(page, "10-scanner-product")
            state["hold"] = True
            shutter.click()
            page.wait_for_timeout(2400)
            shot(page, "11-scanner-analyzing")
            state["hold"] = False
            page.get_by_role("button", name="Close").click()
            page.wait_for_timeout(500)
            page.get_by_role("button", name="Scan").last.click()
            expect(page.get_by_role("button", name="Take photo")).to_be_enabled(timeout=6000)
            page.wait_for_timeout(500)
            page.get_by_role("button", name="Take photo").click()
            expect(page.get_by_role("heading", name=re.compile("Use with care"))).to_be_visible(timeout=8000)
            page.wait_for_timeout(1300)
            shot(page, "12-result-product")
            assert state["scans"] and state["scans"][0]["product_name"] == "Honey Oat Granola"
        check("Product scan: camera, analysis, result, saved to database", product_scan)

        def result_details():
            sheet = page.get_by_role("dialog", name="Honey Oat Granola")
            expect(sheet.get_by_text("Ingredients to watch").first).to_be_visible()
            expect(sheet.get_by_text("High risk")).to_be_visible()
            sheet.get_by_role("button", name="Full ingredient list").click()
            expect(sheet.get_by_text(re.compile("Rolled oats \\(52%\\)"))).to_be_visible()
            sheet.locator(".overflow-y-auto").first.evaluate("el => el.scrollTo(0, 900)")
            shot(page, "13-result-product-scrolled")
            sheet.get_by_role("button", name="Save").click()
            expect(sheet.get_by_role("button", name="Saved")).to_be_visible()
        check("Result details, full list toggle, save to favorites", result_details)

        def close_result():
            page.get_by_role("button", name="Close").first.click()
            page.wait_for_timeout(700)
            expect(page.get_by_role("dialog")).to_have_count(0)
            expect(page.get_by_text("Honey Oat Granola").first).to_be_visible()
            shot(page, "14-home-with-recent")
        check("Closing result returns home with the scan in Recent", close_result)

        # ---------- Errors ----------
        def not_recognized():
            state["gemini"] = "not_recognized"
            page.get_by_role("button", name="Scan").last.click()
            expect(page.get_by_role("button", name="Take photo")).to_be_enabled(timeout=6000)
            page.wait_for_timeout(500)
            page.get_by_role("button", name="Take photo").click()
            expect(page.get_by_text("We couldn't read a label")).to_be_visible(timeout=8000)
            shot(page, "15-error-not-recognized")
            assert len(state["scans"]) == 1, "failed analysis must not be saved"
        check("Unreadable label shows a clear error and is not saved", not_recognized)

        def network_error_then_retry():
            state["gemini"] = "network"
            page.get_by_role("button", name="Try again").click()
            expect(page.get_by_text("Couldn't reach the analysis service")).to_be_visible(timeout=8000)
            shot(page, "16-error-network")
            state["gemini"] = "ok"
            page.get_by_role("button", name="Try again").click()
            expect(page.get_by_role("heading", name=re.compile("Use with care"))).to_be_visible(timeout=8000)
            page.get_by_role("button", name="Close").first.click()
            page.wait_for_timeout(600)
        check("Network failure, then Try again succeeds", network_error_then_retry)

        # ---------- Skin scan ----------
        def skin_scan():
            page.get_by_text("Check your skin").click()
            expect(page.get_by_role("tab", name="Skin", selected=True)).to_be_visible(timeout=5000)
            expect(page.get_by_role("button", name="Take photo")).to_be_enabled(timeout=6000)
            page.wait_for_timeout(700)
            shot(page, "17-scanner-skin")
            state["hold"] = True
            page.get_by_role("button", name="Take photo").click()
            page.wait_for_timeout(2600)
            shot(page, "18-skin-analyzing")
            state["hold"] = False
            page.get_by_role("button", name="Close").click()
            page.wait_for_timeout(500)
            page.get_by_text("Check your skin").click()
            expect(page.get_by_role("button", name="Take photo")).to_be_enabled(timeout=6000)
            page.wait_for_timeout(500)
            page.get_by_role("button", name="Take photo").click()
            expect(page.get_by_role("heading", name=re.compile("Your skin analysis is ready"))).to_be_visible(timeout=8000)
            page.wait_for_timeout(1500)
            shot(page, "19-result-skin")
            dlg = page.get_by_role("dialog")
            expect(dlg.get_by_text("First check. Your next ones will show progress.")).to_be_visible()
            expect(dlg.get_by_text("Start with this")).to_be_visible()
            expect(dlg.get_by_text("Good photo. Results are reliable.")).to_be_visible()
            dlg.get_by_role("button", name=re.compile("Nose and T-zone")).click()
            expect(dlg.get_by_text("Visible pores and some shine on the nose.")).to_be_visible()
            dlg.locator(".overflow-y-auto").first.evaluate("el => el.scrollTo(0, 900)")
            shot(page, "20-result-skin-scrolled")
            dlg.locator(".overflow-y-auto").first.evaluate("el => el.scrollTo(0, 1900)")
            shot(page, "20b-result-skin-routine")
            dlg.get_by_role("button", name="Use as my routine").click()
            expect(dlg.get_by_role("button", name="Saved to your diary")).to_be_visible()
            assert "selfie" in state["last_ai_body"] and "This is the first check" in state["last_ai_body"]
            page.get_by_role("button", name="Close").first.click()
            page.wait_for_timeout(600)
        check("Skin check: zones, concern levels, photo quality, routine saved", skin_scan)

        def mode_switch_and_upload():
            page.get_by_role("button", name="Scan").last.click()
            expect(page.get_by_role("button", name="Take photo")).to_be_enabled(timeout=6000)
            page.get_by_role("tab", name="Skin").click()
            expect(page.get_by_role("tab", name="Skin", selected=True)).to_be_visible()
            page.get_by_role("tab", name="Product").click()
            page.get_by_test_id("file-input").set_input_files(str(ROOT / "assets/label.png"))
            expect(page.get_by_role("heading", name=re.compile("Use with care"))).to_be_visible(timeout=8000)
            page.get_by_role("button", name="Close").first.click()
            page.wait_for_timeout(600)
        check("Mode switch in scanner and photo upload path", mode_switch_and_upload)

        # ---------- Diary ----------
        def diary_today():
            page.get_by_role("button", name="Diary").click()
            expect(page.get_by_role("heading", name="Skin diary")).to_be_visible()
            expect(page.get_by_text("1-day streak")).to_be_visible()
            expect(page.get_by_text("Today's skin check")).to_be_visible()
            # routine from the skin check, morning/evening checklist
            page.get_by_role("tab", name=re.compile("Morning")).click()
            page.get_by_role("checkbox", name=re.compile("Gentle cleanser")).click()
            page.get_by_role("checkbox", name=re.compile("Niacinamide serum")).click()
            expect(page.get_by_text("2 of 3 done")).to_be_visible()
            page.get_by_role("radio", name="Good").click()
            page.get_by_role("button", name="More Sleep").click()
            for _ in range(13):
                page.get_by_role("button", name="More Sleep").click()
            page.get_by_role("button", name=re.compile("Workout")).click()
            page.get_by_role("button", name=re.compile("Sweets")).click()
            page.get_by_placeholder(re.compile("Notes")).fill("Tried the new gel moisturizer.")
            page.wait_for_timeout(700)
            shot(page, "21-diary-today")
            scroll_main_bottom(page)
            shot(page, "21b-diary-today-bottom")
            stored = page.evaluate(f"JSON.parse(localStorage.getItem('vitalSense_diary_{USER_ID}'))")
            today = list(stored.values())[0]
            assert today["feeling"] == 4 and today["sleep"] == 7 and set(today["tags"]) == {"workout", "sugar"}, today
            assert len(today["done"]["am"]) == 2 and today["note"].startswith("Tried"), today
        check("Diary today: routine checklist, mood, sleep, tags, note saved", diary_today)

        def diary_goals_and_routine_edit():
            page.evaluate("document.querySelectorAll('main').forEach(m => m.scrollTo(0, 0))")
            page.get_by_role("button", name=re.compile("Your skin goals")).click()
            page.get_by_role("checkbox", name="Clear breakouts").click()
            page.get_by_role("checkbox", name="Hydration").click()
            page.get_by_role("button", name="Save changes").click()
            page.wait_for_timeout(600)
            expect(page.get_by_text("Clear breakouts, Hydration")).to_be_visible()
            page.get_by_role("button", name="Edit routine").click()
            page.get_by_placeholder("Step, for example Cleanser").fill("Lip balm")
            page.get_by_role("button", name="Add step").click()
            shot(page, "22-routine-editor")
            page.get_by_role("button", name="Save changes").click()
            page.wait_for_timeout(600)
            expect(page.get_by_text("2 of 4 done")).to_be_visible()
        check("Goals and routine editor save", diary_goals_and_routine_edit)

        def diary_history_trends_compare():
            # Seed two weeks of history so trends and patterns have data.
            page.evaluate(f"""() => {{
              const uid = '{USER_ID}';
              const skin = JSON.parse(localStorage.getItem('vitalSense_skin_' + uid));
              const base = skin[0];
              const day = 86400000;
              const logs = JSON.parse(localStorage.getItem('vitalSense_diary_' + uid));
              const pad = n => String(n).padStart(2,'0');
              const key = ts => {{ const d = new Date(ts); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }};
              for (let i = 1; i <= 8; i++) {{
                const ts = Date.now() - i * day * 2;
                const sugar = i % 2 === 0;
                const score = 70 - i * 2 + (sugar ? -6 : 3);
                skin.push({{ ...base, id: 'seed' + i, photoId: undefined, timestamp: ts, skinScore: score,
                  metrics: {{ ...base.metrics, texture: base.metrics.texture - i * 2, moisture: base.metrics.moisture - i }} }});
                const k = key(ts - day);
                logs[k] = {{ date: k, tags: sugar ? ['sugar'] : [], sleep: sugar ? 6 : 8, done: {{ am: [], pm: [] }} }};
              }}
              localStorage.setItem('vitalSense_skin_' + uid, JSON.stringify(skin));
              localStorage.setItem('vitalSense_diary_' + uid, JSON.stringify(logs));
            }}""")
            page.reload()
            page.wait_for_load_state("networkidle")
            page.get_by_role("button", name="Diary").click()
            page.get_by_role("tab", name="History").click()
            expect(page.get_by_text("Diary entry").first.or_(page.get_by_text("Tried the new gel moisturizer.")).first).to_be_visible()
            shot(page, "23-diary-history")
            page.get_by_role("button", name="Compare").click()
            items = page.locator("ol li button[aria-pressed]")
            items.nth(0).click()
            items.nth(3).click()
            expect(page.get_by_role("heading", name="Compare checks")).to_be_visible(timeout=4000)
            page.wait_for_timeout(500)
            shot(page, "24-compare")
            page.get_by_role("button", name="Close").first.click()
            page.wait_for_timeout(600)
            page.get_by_role("tab", name="Trends").click()
            page.get_by_role("button", name="All", exact=True).click()
            expect(page.get_by_text("Patterns in your diary")).to_be_visible()
            expect(page.get_by_text(re.compile("On days with sweets"))).to_be_visible()
            page.locator("main svg[role=img]").first.hover()
            page.wait_for_timeout(500)
            shot(page, "25-diary-trends")
            scroll_main_bottom(page)
            shot(page, "26-diary-metrics")
        check("Diary history, compare two checks, trends and patterns", diary_history_trends_compare)

        def products_from_diary():
            page.evaluate("document.querySelectorAll('main').forEach(m => m.scrollTo(0, 0))")
            page.get_by_role("tab", name="Today").click()
            scroll_main_bottom(page)
            page.get_by_role("button", name=re.compile("Product scans")).click()
            dlg = page.get_by_role("dialog")
            expect(dlg.get_by_text("Honey Oat Granola").first).to_be_visible()
            dlg.get_by_role("button", name="Saved", exact=True).first.click()
            expect(dlg.locator("li")).to_have_count(1)
            page.go_back()
            page.wait_for_timeout(700)
            expect(page.get_by_role("dialog")).to_have_count(0)
        check("Product scans open from the diary, system back closes", products_from_diary)

        # ---------- Explore ----------
        def explore():
            page.get_by_role("button", name="Explore").click()
            expect(page.get_by_text("Short reads picked for Pregnancy")).to_be_visible()
            expect(page.get_by_text(re.compile(r"312 articles from \d+ sources"))).to_be_visible(timeout=5000)
            q = state["feed_queries"][-1]
            assert "condition=Pregnancy" in q and "Gestational+Diabetes" in q and "goals=clearBreakouts" in q, q
            expect(page.get_by_text(re.compile("Because of Gestational Diabetes")).first).to_be_visible()
            shot(page, "27-explore-feed")
            page.get_by_role("button", name="Pregnancy", exact=True).click()
            page.wait_for_timeout(300)
            scroll_main_bottom(page)
            page.wait_for_timeout(600)
            assert page.locator("main ul li").count() > 20, "infinite list loads more"
            page.evaluate("document.querySelectorAll('main').forEach(m => m.scrollTo(0, 0))")
            page.get_by_role("button", name="For you").click()
            page.locator("main ul li").first.click()
            page.wait_for_timeout(700)
            link = page.get_by_role("link", name=re.compile("Read the full article on"))
            expect(link).to_be_visible()
            assert link.get_attribute("href").startswith("https://") and link.get_attribute("target") == "_blank"
            shot(page, "28-feed-article")
            page.get_by_role("button", name="Back").click()
            page.wait_for_timeout(700)
            page.get_by_text("Skincare ingredients to pause during pregnancy").first.click()
            page.wait_for_timeout(700)
            shot(page, "24-article")
            page.get_by_role("button", name="Back").click()
            page.wait_for_timeout(700)
            expect(page.get_by_role("dialog")).to_have_count(0)
        check("Explore: live feed personalized to profile, filters, more, source link, guides", explore)

        # ---------- Profile ----------
        def profile():
            page.get_by_role("button", name="Profile").last.click()
            expect(page.get_by_text("sarah@example.com")).to_be_visible()
            shot(page, "26-profile")
            page.get_by_role("button", name="Update symptoms").click()
            page.get_by_role("button", name="Headache").click()
            page.get_by_role("button", name="Save changes").click()
            page.wait_for_timeout(700)
            expect(page.get_by_text("Nausea, Headache")).to_be_visible()
            assert state["profile"]["current_symptoms"] == ["Nausea", "Headache"]
            page.get_by_role("button", name="Edit health profile").click()
            expect(page.get_by_role("radio", name=re.compile("Pregnancy"))).to_have_attribute("aria-checked", "true")
            shot(page, "27-edit-profile")
            page.get_by_role("button", name="Cancel").click()
            page.wait_for_timeout(600)
        check("Profile: update symptoms saves, edit opens prefilled", profile)

        def home_feeling_card():
            page.get_by_role("button", name="Home").click()
            page.get_by_text("How do you feel today?").click()
            expect(page.get_by_role("button", name="Headache")).to_have_attribute("aria-pressed", "true")
            page.get_by_role("button", name="Close").click()
            page.wait_for_timeout(500)
        check("Home check-in opens symptoms with current state", home_feeling_card)

        def arabic_rtl():
            page.get_by_role("button", name="Profile").last.click()
            page.wait_for_timeout(300)
            scroll_main_bottom(page)
            page.get_by_role("button", name=re.compile("Language")).click()
            page.get_by_role("radio", name=re.compile("العربية")).click()
            page.wait_for_timeout(500)
            assert page.evaluate("document.documentElement.dir") == "rtl"
            page.get_by_role("button", name="الرئيسية").click()
            shot(page, "28-home-arabic-rtl")
            page.get_by_role("button", name="الملف").last.click()
            page.wait_for_timeout(300)
            scroll_main_bottom(page)
            page.get_by_role("button", name=re.compile("اللغة")).click()
            page.get_by_role("radio", name=re.compile("English")).click()
            page.wait_for_timeout(500)
            assert page.evaluate("document.documentElement.dir") == "ltr"
        check("Arabic switches layout to RTL and back", arabic_rtl)

        def persistence_after_reload():
            page.reload()
            page.wait_for_load_state("networkidle")
            expect(page.get_by_role("heading", name=re.compile("Hi Sarah"))).to_be_visible(timeout=6000)
            page.get_by_role("button", name="Diary").click()
            expect(page.get_by_text("Clear breakouts, Hydration")).to_be_visible()
            scroll_main_bottom(page)
            page.get_by_role("button", name=re.compile("Product scans")).click()
            dlg = page.get_by_role("dialog")
            dlg.get_by_role("button", name="Saved", exact=True).first.click()
            expect(dlg.locator("li")).to_have_count(1)  # favorite survives the server refetch
            page.go_back()
            page.wait_for_timeout(600)
        check("Reload keeps session, history and favorites", persistence_after_reload)

        def cloud_restores_after_storage_wipe():
            assert len(state["cloud_skin"]) >= 1 and len(state["cloud_logs"]) >= 1 and state["cloud_settings"], (len(state["cloud_skin"]), len(state["cloud_logs"]), state["cloud_settings"])
            assert any(p.endswith(".jpg") for p in state["cloud_photos"]), "skin photo uploaded to private storage"
            # Wipe everything this device stored for the app except the sign-in session, plus photos.
            page.evaluate("""async () => {
              for (const k of Object.keys(localStorage)) if (k.startsWith('vitalSense_')) localStorage.removeItem(k);
              await new Promise(r => { const q = indexedDB.deleteDatabase('vitalSense_photos'); q.onsuccess = q.onerror = q.onblocked = () => r(); });
            }""")
            page.reload()
            page.wait_for_load_state("networkidle")
            expect(page.get_by_role("heading", name=re.compile("Hi Sarah"))).to_be_visible(timeout=6000)
            page.get_by_role("button", name="Diary").click()
            expect(page.get_by_text("Clear breakouts, Hydration")).to_be_visible(timeout=5000)
            page.get_by_role("tab", name="History").click()
            expect(page.get_by_text("Tried the new gel moisturizer.")).to_be_visible()
            page.get_by_role("tab", name="Today").click()
            page.get_by_role("tab", name=re.compile("Morning")).click()
            expect(page.get_by_text("2 of 4 done")).to_be_visible()
            img = page.locator("main img").first
            expect(img).to_be_visible()
            assert page.evaluate("[...document.querySelectorAll('main img')].some(i => i.src.startsWith('data:image/jpeg') && i.naturalWidth > 0)"), "photo restored from cloud storage"
            shot(page, "29-restored-from-cloud")
        check("Diary, routine, goals and photos restore from the account after device data is wiped", cloud_restores_after_storage_wipe)

        def backup_status_shown():
            page.get_by_role("button", name="Profile").last.click()
            page.wait_for_timeout(300)
            scroll_main_bottom(page)
            expect(page.get_by_text("Synced to your account")).to_be_visible()
        check("Profile shows backup is synced", backup_status_shown)

        def sign_out():
            page.get_by_role("button", name="Profile").last.click()
            page.wait_for_timeout(300)
            scroll_main_bottom(page)
            page.get_by_role("button", name="Sign out").click()
            expect(page.get_by_role("heading", name=re.compile("Hi there"))).to_be_visible(timeout=5000)
            expect(page.get_by_text("Honey Oat Granola")).to_have_count(0)
            page.get_by_role("button", name="Profile").last.click()
            expect(page.get_by_role("heading", name="Make every scan personal")).to_be_visible()
        check("Sign out returns to guest state", sign_out)

        def no_em_dash_on_screen():
            texts = page.evaluate("document.body.innerText")
            assert "\u2014" not in texts and "\u2013" not in texts
        check("No em or en dashes in rendered copy", no_em_dash_on_screen)

        def no_console_errors():
            relevant = [e for e in console_errors if "Failed to load resource" not in e and "ERR_INTERNET_DISCONNECTED" not in e]
            assert not relevant, relevant[:5]
        check("No console errors", no_console_errors)

        # Desktop sanity
        dpage = browser.new_page(viewport={"width": 1280, "height": 860})
        dpage.route(re.compile(r".*images\.unsplash\.com/.*"), lambda r: r.fulfill(status=200, content_type="image/jpeg", body=PLACEHOLDER))
        dpage.goto(URL)
        dpage.wait_for_timeout(1200)
        dpage.screenshot(path=str(OUT / "29-desktop.png"))

        browser.close()

    passed = sum(1 for r in results if r[1] == "PASS")
    print(f"\n{passed}/{len(results)} checks passed")
    (OUT / "report.json").write_text(json.dumps(results, indent=2, ensure_ascii=False))
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
