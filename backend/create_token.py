"""
Yangi xaridorga token yaratish:

  python create_token.py "Sardor" "@sardor_uz" "important-decision.html"

Argumentlar:
  1 - xaridor ismi (majburiy)
  2 - telegram username (ixtiyoriy, bo'lmasa "")
  3 - html fayl nomi (ixtiyoriy, default: default.html)
"""
import secrets
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
import models

db = SessionLocal()

buyer_name = sys.argv[1] if len(sys.argv) > 1 else input("Xaridor ismi: ")
telegram   = sys.argv[2] if len(sys.argv) > 2 else input("Telegram (@username, bo'sh qoldirsa Enter): ")
html_file  = sys.argv[3] if len(sys.argv) > 3 else "default.html"

token = secrets.token_urlsafe(32)

new_tok = models.SpeakingToken(
    token=token,
    buyer_name=buyer_name,
    telegram=telegram,
    html_file=html_file,
)
db.add(new_tok)
db.commit()
db.close()

print()
print("=" * 60)
print(f"  Token yaratildi!")
print(f"  Xaridor : {buyer_name} {telegram}")
print(f"  Fayl    : {html_file}")
print(f"  URL     : http://localhost:8000/s/{token}")
print("=" * 60)
print(f"\n  Token (to'liq):\n  {token}\n")
