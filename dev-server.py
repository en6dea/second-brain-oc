#!/usr/bin/env python3
"""Локальный сервер для разработки.

Отличается от `python -m http.server` одним: запрещает кэширование.

Это важно именно здесь. Приложение собрано из ES-модулей, которые
подключаются по относительным путям без версии, и браузер держит их в
памяти. После правки файла в v2/src/ обычный сервер отдаёт 304, браузер
берёт старый код — и правка будто не применилась. На этом легко потерять
полчаса, отлаживая уже исправленную ошибку.

Запуск:  python dev-server.py [порт]
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        """Тихий лог: только ошибки, иначе консоль тонет в запросах модулей."""
        status = str(args[1]) if len(args) > 1 else ""
        if status.startswith("4") or status.startswith("5"):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8834
    handler = partial(NoCacheHandler, directory=".")
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print(f"Прежняя версия: http://localhost:{port}/index.html")
    print(f"Новая версия:   http://localhost:{port}/v2/index.html")
    print("Остановить — Ctrl+C")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nостановлен")


if __name__ == "__main__":
    main()
