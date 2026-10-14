"""
Records the real app (vite preview on :4173) for the landing page: short clips and stills of
Today, a product scan, a skin check, a meal photo, the quiz to plan flow and Progress.

Uses the same mocked Supabase and AI as qa/e2e.py, seeded with a month of demo data.
Output: qa/landing/out/<lang>/<clip>.mp4|.webm|.jpg

  python3 qa/landing/capture.py
"""
import base64
import io
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
import e2e  # noqa: E402  (mock routes, payloads, session)

URL = "http://localhost:4173/"
OUT = HERE / "out"
UID = e2e.USER_ID
W, H = 390, 844


def thumb(path: Path, size=480) -> str:
    im = Image.open(path).convert("RGB")
    im.thumbnail((size, size))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=82)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


SELFIE = thumb(HERE / "selfie.png")
MEAL = thumb(HERE / "meal.png", 240)

NAMES = {
    "en": {
        "am": ["Gentle cleanser", "Niacinamide serum", "Light gel moisturizer", "Sunscreen SPF 30 or higher"],
        "pm": ["Cleanser", "Salicylic acid (BHA)", "Moisturizer"],
        "meals": [
            ("Salmon salad", "🥗", ["omega3", "veggies", "protein"], "good", "Omega-3 and greens support calmer skin."),
            ("Eggs on wholegrain toast", "🍳", ["protein"], "neutral", "A steady breakfast with little effect on skin."),
        ],
    },
    "id": {
        "am": ["Sabun muka lembut", "Serum niacinamide", "Pelembap gel ringan", "Sunscreen SPF 30 atau lebih"],
        "pm": ["Sabun muka", "Salicylic acid (BHA)", "Pelembap"],
        "meals": [
            ("Salad salmon", "🥗", ["omega3", "veggies", "protein"], "good", "Omega-3 dan sayuran mendukung kulit lebih tenang."),
            ("Telur dan roti gandum", "🍳", ["protein"], "neutral", "Sarapan yang stabil, sedikit pengaruh ke kulit."),
        ],
    },
}

MEAL_RESULT = {
    "en": {"recognized": True, "name": "Curry rice and boba milk tea", "emoji": "🍛", "flags": ["highGI", "sugar", "dairy"], "skin": "bad",
           "note": "Fast carbs plus sweet milk tea may work against breakout-prone skin."},
    "id": {"recognized": True, "name": "Nasi kari dan boba milk tea", "emoji": "🍛", "flags": ["highGI", "sugar", "dairy"], "skin": "bad",
           "note": "Karbo cepat dan teh susu manis bisa memperburuk kulit yang mudah berjerawat."},
}

PLAN = {
    "focus": "focus_clear",
    "reduce": ["r_sugar", "r_dairy", "r_highGI", "r_fried"],
    "add": ["a_omega3", "a_vitC", "a_zinc", "a_water"],
    "am": ["am_cleanser", "am_niacinamide", "am_moisturizer_light", "am_spf"],
    "pm": ["pm_cleanser", "pm_bha", "pm_moisturizer"],
    "habits": ["h_logMeals", "h_selfie", "h_sleep", "h_pillow"],
    "createdAt": int(time.time() * 1000),
}
QUIZ = {"skinType": "combination", "concerns": ["breakouts", "marks"], "sensitive": "no", "age": "a25", "sugar": 1, "dairy": 1, "fried": 1,
        "water": 1, "sleep": 1, "stress": 1, "routine": 1, "pregnancy": "no", "source": "tiktok", "completedAt": int(time.time() * 1000)}


def seed_js(lang: str) -> str:
    n = NAMES[lang]
    day = 86400000
    now = int(time.time() * 1000)
    skin = []
    scores = [52, 55, 53, 58, 60, 57, 63, 66, 64, 70, 74, 78]
    for i, sc in enumerate(scores):
        ts = now - (len(scores) - 1 - i) * day * 2.5 - 3600000
        item = dict(e2e.SKIN)
        item.update({"id": f"seed{i}", "timestamp": int(ts), "skinScore": sc, "photoId": f"seed{i}",
                     "metrics": {**e2e.SKIN["metrics"], "moisture": 60 + i * 2, "texture": 48 + i * 2, "evenness": 58 + i}})
        skin.append(item)
    skin.reverse()
    routine = {
        "am": [{"id": f"am{i}", "name": x} for i, x in enumerate(n["am"])],
        "pm": [{"id": f"pm{i}", "name": x} for i, x in enumerate(n["pm"])],
        "updatedAt": now,
    }
    logs = {}
    import datetime as dt
    for i in range(1, 30):
        d = (dt.date.today() - dt.timedelta(days=i)).isoformat()
        sugar = i % 3 == 0
        logs[d] = {"date": d, "tags": ["sugar"] if sugar else [], "sleep": 6 if sugar else 8, "done": {"am": ["am0", "am3"], "pm": ["pm0"]},
                   "meals": [{"id": f"m{i}", "ts": now - i * day, "name": "x", "emoji": "🧋" if sugar else "🥗", "flags": ["sugar", "dairy"] if sugar else ["veggies"],
                              "skin": "bad" if sugar else "good", "note": ""}], "updatedAt": now - i * day}
    today = dt.date.today().isoformat()
    logs[today] = {"date": today, "tags": [], "feeling": 4, "sleep": 8, "done": {"am": ["am0", "am1", "am3"], "pm": []},
                   "meals": [{"id": f"t{i}", "ts": now - (2 - i) * 3 * 3600000, "name": m[0], "emoji": m[1], "flags": m[2], "skin": m[3], "note": m[4],
                              "photoId": None} for i, m in enumerate(n["meals"])], "updatedAt": now}
    prefs = {"goals": ["clearBreakouts", "evenTone"], "avoid": ["addedSugar", "fragrance", "comedogenic"], "quiz": QUIZ, "plan": PLAN}
    data = {
        f"vitalSense_skin_{UID}": skin,
        f"vitalSense_diary_{UID}": logs,
        f"vitalSense_routine_{UID}": routine,
        f"vitalSense_diaryPrefs_{UID}": prefs,
        f"vitalSense_entitlement_{UID}": {"active": True, "plan": "annual", "trialEndsAt": now + 6 * day, "source": "test"},
        "vitalSense_lang": lang,
    }
    photos = {f"seed{i}": SELFIE for i in range(len(scores))}
    return f"""async () => {{
      const data = {json.dumps(data)};
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      const photos = {json.dumps(photos)};
      await new Promise((resolve) => {{
        const req = indexedDB.open('vitalSense_photos', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('photos');
        req.onsuccess = () => {{
          const tx = req.result.transaction('photos', 'readwrite');
          for (const [k, v] of Object.entries(photos)) tx.objectStore('photos').put(v, k);
          tx.oncomplete = () => resolve();
        }};
      }});
    }}"""


PRODUCT_TXT = {
    "en": {
        "explanation": "This granola is high in added sugar, which can make breakouts worse for combination skin. The oats and almonds add fiber and protein, so a small portion with plain yogurt is a better fit.",
        "skinImpact": {"level": "bad", "summary": "High added sugar can make breakouts worse for some people with combination skin.",
                       "points": ["Sugar and glucose syrup raise the glycemic load", "Almonds add a little vitamin E"]},
    },
    "id": {
        "productName": "Granola Madu",
        "explanation": "Granola ini tinggi gula tambahan, yang bisa memperparah jerawat pada kulit kombinasi. Oat dan almon menambah serat dan protein, jadi porsi kecil dengan yogurt tawar lebih cocok.",
        "skinImpact": {"level": "bad", "summary": "Gula tambahan yang tinggi bisa memperparah jerawat pada sebagian orang dengan kulit kombinasi.",
                       "points": ["Gula dan sirup glukosa menaikkan beban glikemik", "Almon menambah sedikit vitamin E"]},
        "ingredients": [
            {"name": "Gula", "riskLevel": "High Risk", "description": "Bahan kedua terbanyak. Cepat menumpuk bersama sirup glukosa dan madu."},
            {"name": "Sirup glukosa", "riskLevel": "Moderate", "description": "Gula yang cepat menaikkan gula darah."},
            {"name": "Oat gulung", "riskLevel": "Safe", "description": "Biji-bijian utuh dengan serat larut."},
        ],
        "alternatives": [
            {"name": "Oat gulung dengan buah beri", "reason": "Serat sama, tanpa gula tambahan."},
            {"name": "Muesli tanpa gula", "reason": "Tetap renyah dengan gula jauh lebih sedikit."},
        ],
    },
}
SKIN_TXT = {
    "id": {
        "concerns": ["Pori terlihat", "Jerawat ringan", "Pipi kering"],
        "concernDetails": [
            {"id": "breakouts", "severity": 1, "zones": ["chin", "forehead"], "note": "Beberapa benjolan kecil di dagu dan dekat garis rambut."},
            {"id": "enlargedPores", "severity": 2, "zones": ["tzone"], "note": "Pori di hidung tampak lebih besar daripada di pipi."},
            {"id": "darkSpots", "severity": 1, "zones": ["leftCheek"], "note": "Bekas samar dari jerawat yang sudah sembuh."},
            {"id": "redness", "severity": 0, "zones": [], "note": ""},
        ],
        "topPriority": "Tambahkan serum niacinamide lembut di T-zone malam hari untuk menenangkan minyak dan merapikan pori.",
        "summary": "Kulitmu cukup lembap, dengan sedikit penyumbatan di sekitar hidung dan beberapa area tidak merata. Eksfoliasi lembut dan sunscreen setiap hari paling membantu.",
        "zones": [
            {"zone": "forehead", "score": 70, "note": "Beberapa komedo tertutup kecil dekat garis rambut."},
            {"zone": "tzone", "score": 55, "note": "Pori terlihat dan sedikit mengilap di hidung."},
            {"zone": "leftCheek", "score": 80, "note": "Merata dan tenang, sedikit kering di tulang pipi."},
            {"zone": "rightCheek", "score": 78, "note": "Mirip sisi kiri, sedikit kering."},
            {"zone": "chin", "score": 62, "note": "Dua benjolan merah kecil di garis rahang."},
            {"zone": "underEye", "score": 68, "note": "Bayangan ringan di bawah kedua mata."},
        ],
        "routine": [
            {"time": "am", "step": "Sabun muka lembut", "ingredient": "", "tip": "Pakai pembersih busa rendah agar pipi tetap nyaman."},
            {"time": "am", "step": "Serum niacinamide", "ingredient": "Niacinamide", "tip": "Membantu minyak dan pori di T-zone."},
            {"time": "am", "step": "Sunscreen SPF 30+", "ingredient": "Zinc oxide", "tip": "Setiap pagi, meski mendung."},
            {"time": "pm", "step": "Sabun muka", "ingredient": "", "tip": "Bersihkan sunscreen sepenuhnya."},
            {"time": "pm", "step": "Azelaic acid", "ingredient": "Azelaic acid", "tip": "Tipis di dagu dan bekas jerawat, tiga malam seminggu."},
            {"time": "pm", "step": "Pelembap", "ingredient": "Ceramide", "tip": "Gel krim ringan agar pipi tetap nyaman."},
        ],
    }
}


def localized(base, txt, lang):
    out = dict(base)
    out.update(txt.get(lang, {}))
    return out


class Ai:
    """AI mock that can hold a request so the analyzing screen stays visible for a moment."""

    def __init__(self, lang):
        self.lang = lang
        self.pending = []

    def payload(self, body: str):
        if "photo of a meal" in body:
            return MEAL_RESULT[self.lang]
        if "selfie" in body:
            return localized(e2e.SKIN, SKIN_TXT, self.lang)
        return localized(e2e.PRODUCT, PRODUCT_TXT, self.lang)

    def route(self, route):
        if route.request.method == "GET":
            return route.fulfill(status=200, content_type="application/json", body=json.dumps({"configured": True}))
        self.pending.append(route)

    def release(self):
        for r in self.pending:
            p = self.payload(r.request.post_data or "")
            r.fulfill(status=200, content_type="application/json",
                      body=json.dumps({"choices": [{"index": 0, "message": {"role": "assistant", "content": json.dumps(p)}, "finish_reason": "stop"}]}))
        self.pending = []


def session(p, lang, y4m, clip_dir):
    browser = p.chromium.launch(args=["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", f"--use-file-for-fake-video-capture={y4m}"])
    ctx = browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=2, is_mobile=True, has_touch=True,
                              locale="id-ID" if lang == "id" else "en-US", permissions=["camera"],
                              record_video_dir=str(clip_dir), record_video_size={"width": W, "height": H})
    ai = Ai(lang)
    ctx.route("**/*supabase.co/**", e2e.supabase_route)
    ctx.route("**/api/chat", ai.route)
    feed = (HERE.parent / "fixtures/feed-pregnancy.json").read_text()
    ctx.route("**/api/feed?*", lambda r: r.fulfill(status=200, content_type="application/json", body=feed))
    ctx.route("**/images.unsplash.com/**", lambda r: r.fulfill(status=200, content_type="image/jpeg", body=e2e.PLACEHOLDER))
    ctx.add_init_script(f"localStorage.setItem('sb-rebsjmkxhdxcqtkrzgow-auth-token', {json.dumps(json.dumps(e2e.session_json()))})")
    page = ctx.new_page()
    t0 = time.time()
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.evaluate(seed_js(lang))
    page.goto("about:blank")
    return browser, ctx, page, ai, t0


def reset_state(lang):
    e2e.state.update({
        "profile": {"id": UID, "name": "Sarah Putri", "condition": "General Health", "custom_condition_name": None,
                    "additional_context": ["Acne-Prone Skin"], "current_symptoms": [], "language": "id" if lang == "id" else "en"},
        "scans": [], "cloud_skin": {}, "cloud_logs": {}, "cloud_settings": None, "cloud_photos": {},
    })


def tab(page, name):
    page.get_by_role("navigation").get_by_role("button", name=name).click()


def clip(p, lang, name, y4m, run):
    reset_state(lang)
    tmp = OUT / "_raw" / f"{lang}-{name}"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir(parents=True)
    browser, ctx, page, ai, t0 = session(p, lang, y4m, tmp)
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    start = time.time() - t0
    run(page, ai, lang)
    end = time.time() - t0
    still = OUT / lang / f"{name}.jpg"
    still.parent.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(still), type="jpeg", quality=88)
    video = page.video
    ctx.close()
    browser.close()
    raw = video.path()
    dest = OUT / lang / f"{name}.mp4"
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{start + 0.15:.2f}", "-to", f"{end:.2f}", "-i", str(raw),
                    "-vf", "fps=30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-profile:v", "main", "-crf", "22",
                    "-movflags", "+faststart", "-an", str(dest)], check=True)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(dest), "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-an", str(dest.with_suffix(".webm"))], check=True)
    print(lang, name, f"{end - start:.1f}s", dest.stat().st_size // 1024, "KB")


# ---------- clips ----------

def run_today(page, ai, lang):
    page.wait_for_timeout(2600)
    main = page.locator("main")
    for y in (220, 440, 660, 880):
        main.evaluate(f"m => m.scrollTo({{ top: {y}, behavior: 'smooth' }})")
        page.wait_for_timeout(900)
    main.evaluate("m => m.scrollTo({ top: 0, behavior: 'smooth' })")
    page.wait_for_timeout(1400)


def run_scan(page, ai, lang):
    page.wait_for_timeout(900)
    page.get_by_text("Scan a product" if lang == "en" else "Pindai produk", exact=False).first.click()
    page.get_by_role("button", name="Take photo" if lang == "en" else "Ambil foto").wait_for(state="visible", timeout=8000)
    page.wait_for_timeout(1300)
    page.get_by_role("button", name="Take photo" if lang == "en" else "Ambil foto").click()
    page.wait_for_timeout(2200)
    ai.release()
    page.wait_for_timeout(3200)
    page.locator("[role=dialog] .overflow-y-auto").first.evaluate("el => el.scrollTo({ top: 520, behavior: 'smooth' })")
    page.wait_for_timeout(2200)


def run_skin(page, ai, lang):
    page.wait_for_timeout(900)
    page.get_by_text("Check your skin" if lang == "en" else "Cek kulitmu", exact=True).first.click()
    page.get_by_role("button", name="Take photo" if lang == "en" else "Ambil foto").wait_for(state="visible", timeout=8000)
    page.wait_for_timeout(1500)
    page.get_by_role("button", name="Take photo" if lang == "en" else "Ambil foto").click()
    page.wait_for_timeout(2400)
    ai.release()
    page.wait_for_timeout(3000)
    page.locator("[role=dialog] .overflow-y-auto").first.evaluate("el => el.scrollTo({ top: 760, behavior: 'smooth' })")
    page.wait_for_timeout(2400)


def run_meal(page, ai, lang):
    page.wait_for_timeout(700)
    card = page.get_by_test_id("meals-card")
    card.evaluate("el => el.scrollIntoView({ behavior: 'smooth', block: 'center' })")
    page.wait_for_timeout(1200)
    page.get_by_test_id("meal-input").set_input_files(str(HERE / "meal.png"))
    page.wait_for_timeout(1800)
    ai.release()
    page.wait_for_timeout(2600)


def run_plan(page, ai, lang):
    page.wait_for_timeout(700)
    page.get_by_test_id("plan-card").click()
    page.wait_for_timeout(900)
    retake = "Retake the quiz" if lang == "en" else "Ulangi kuis"
    page.get_by_text(retake).scroll_into_view_if_needed()
    page.get_by_text(retake).click()
    quiz = page.get_by_test_id("skin-quiz")
    quiz.wait_for(state="visible")
    page.wait_for_timeout(700)
    for i in range(13):
        page.wait_for_timeout(520)
        if quiz.get_by_role("checkbox").count() and i == 1:
            quiz.get_by_role("checkbox").nth(2).click()
            page.wait_for_timeout(450)
            quiz.get_by_role("button", name="Continue" if lang == "en" else "Lanjut").click()
            continue
        opts = quiz.get_by_role("radio")
        opts.nth(1 if opts.count() > 1 else 0).click()
    page.get_by_test_id("plan-view").wait_for(state="visible", timeout=8000)
    page.wait_for_timeout(1600)
    page.locator("[data-testid=plan-view]").evaluate("el => el.scrollTo({ top: 420, behavior: 'smooth' })")
    page.wait_for_timeout(1800)


def run_progress(page, ai, lang):
    page.wait_for_timeout(600)
    tab(page, "Progress" if lang == "en" else "Progres")
    page.wait_for_timeout(1200)
    page.get_by_role("button", name="All" if lang == "en" else "Semua", exact=True).click()
    page.wait_for_timeout(1400)
    page.locator("main").evaluate("m => m.scrollTo({ top: 520, behavior: 'smooth' })")
    page.wait_for_timeout(2600)


def main():
    label = e2e.Y4M
    selfie = HERE / "selfie.y4m"
    OUT.mkdir(exist_ok=True)
    langs = sys.argv[1:] or ["id", "en"]
    with sync_playwright() as p:
        for lang in langs:
            clip(p, lang, "today", label, run_today)
            clip(p, lang, "scan", label, run_scan)
            clip(p, lang, "skin", selfie, run_skin)
            clip(p, lang, "meal", label, run_meal)
            clip(p, lang, "plan", label, run_plan)
            clip(p, lang, "progress", label, run_progress)
    shutil.rmtree(OUT / "_raw", ignore_errors=True)


if __name__ == "__main__":
    if len(sys.argv) > 2:
        names = sys.argv[2].split(",")
        fns = {"today": run_today, "scan": run_scan, "skin": run_skin, "meal": run_meal, "plan": run_plan, "progress": run_progress}
        with sync_playwright() as p:
            for n in names:
                clip(p, sys.argv[1], n, HERE / "selfie.y4m" if n == "skin" else e2e.Y4M, fns[n])
    else:
        main()
