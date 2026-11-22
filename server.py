"""server.py — отдаёт страницу и принимает заявки с формы.

Запуск:
    python server.py              # http://127.0.0.1:8094
    python server.py --port 9000

Заявки пишутся в zayavki.jsonl рядом со страницей (по строке на заявку).
Для хостинга эту ручку заменяют на Formspree или свой эндпоинт.
"""
import http.server, socketserver, json, os, sys, datetime, re

HERE = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(HERE, "zayavki.jsonl")
PORT = 8094


def next_id():
    if not os.path.exists(STORE):
        return 1
    with open(STORE, encoding="utf-8") as f:
        return sum(1 for _ in f) + 1


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def do_POST(self):
        if self.path != "/api/zayavka":
            self.send_error(404)
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(n).decode("utf-8-sig"))
        except Exception as e:
            self.send_json({"error": "не разобрал данные: %s" % e}, 400)
            return

        name = (data.get("name") or "").strip()
        phone = (data.get("phone") or "").strip()
        digits = re.sub(r"\D+", "", phone)

        if len(name) < 2 or len(digits) < 10:
            self.send_json({"error": "нужны имя и телефон"}, 400)
            return

        rec = {
            "id": next_id(),
            "at": datetime.datetime.now().isoformat(timespec="seconds"),
            "name": name,
            "phone": phone,
            "route": (data.get("route") or "").strip(),
            "comment": (data.get("comment") or "").strip(),
            "page": data.get("page") or "",
        }
        with open(STORE, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

        self.send_json({"ok": True, "id": rec["id"]})

    def send_json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stdout.write("  %s\n" % (fmt % args))


if __name__ == "__main__":
    if "--port" in sys.argv:
        PORT = int(sys.argv[sys.argv.index("--port") + 1])
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print("  страница: http://127.0.0.1:%d" % PORT)
        print("  заявки:   %s" % STORE)
        httpd.serve_forever()
