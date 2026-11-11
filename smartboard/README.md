# SmartBoard: oddiy doskani sensorli doskaga aylantirish

Oddiy proyektor (masalan Epson CO-W01), oddiy doska yoki ekran va veb-kamera
yetarli. Doskaga tegsangiz noutbukda bosilgan bo'ladi, sursangiz sahifa suriladi.

## Qaysi usul eng barqaror?

Bitta kamera doskaga **old tomondan** qarasa, barmoq doskaga **tegdimi yoki
1 sm oldida turibdimi**, buni aniq ajrata olmaydi. Codex'dagi xatolarning
asosiy sababi shu: "tegish"ni kamera bilan topishga urinish beqaror ishlaydi.
Shuning uchun dastur ikki rejimda ishlaydi va ikkalasi ham bu muammoni chetlab o'tadi:

| Rejim | Nima kerak | Bosish qanday | Barqarorlik |
|---|---|---|---|
| **pen** (ruchka) | yorug'lik ruchkasi: IR ruchka, uchi bosilganda yonadigan LED ruchka, telefon chirog'i yoki lazer | yorug'lik ko'rindi = bosildi, yo'qoldi = qo'yib yuborildi | **Eng barqaror.** Har qanday yorug'likda ishlaydi, haqiqiy sensorli doskalar (Wiimote/BrightLink) shu usulda ishlaydi |
| **hand** (qo'l) | hech narsa, faqat kamera | barmoqni 0.8 s qimirlatmay ushlab turing = **bosish**; bosh va ko'rsatkich barmoqni qisib (pinch) yurgizing = **surish** | Yaxshi, qo'shimcha jihozsiz. Xona juda qorong'i bo'lmasin |

Ikkala rejimda ham:
- **9 nuqtali avtomatik kalibrovka** (RANSAC): kamera qaysi burchakdan qarasa ham ishlaydi, kimdir o'tib ketsa bitta nuqta tashlab yuboriladi.
- **Windows'ga haqiqiy touch** yuboriladi (InjectTouchInput), shuning uchun brauzer, PDF, PowerPoint'da barmoq bilan surish **haqiqiy sensorli ekrandagidek** ishlaydi. Touch ishlamasa avtomatik sichqonchaga o'tadi.
- **One Euro filter**: kursor titramaydi, tez harakatda kechikmaydi.
- Bir kadrlik yo'qolishlar, slayd almashganda chiqadigan "soxta bosish"lar filtrlanadi.

### Codex'dagi xato haqida
Yangi `mediapipe` (0.10.30+ va 1.x) versiyalarida `mp.solutions.hands` **olib tashlangan**.
Eski kod `AttributeError: module 'mediapipe' has no attribute 'solutions'` bilan yiqiladi.
Bu dastur yangi **Tasks API** (`HandLandmarker`) dan foydalanadi, model fayli
`models/hand_landmarker.task` ichida (internetsiz ham ishlaydi).
Shuningdek `opencv-python` va `opencv-contrib-python` birga o'rnatilsa `cv2` buziladi:
faqat `opencv-contrib-python` ishlating (requirements.txt shunday).

## O'rnatish (Windows)

1. Python 3.12 o'rnating (python.org, "Add python.exe to PATH" belgilang).
2. `START_SMARTBOARD.bat` ni ikki marta bosing. Birinchi marta kutubxonalarni o'zi o'rnatadi.
3. `Win + P` → **Дублировать / Duplicate**.

Qo'lda: `pip install -r requirements.txt`, keyin `python smartboard.py`.

## Ishga tushirish

1. Kamerani doskaga qarating: proyeksiyaning **4 ta burchagi ham** kadrda bo'lsin.
   Kamera qimirlamasin (shtativ yoki skotch). Qimirlasa qayta kalibrovka qiling.
2. Doska oldidan chetga chiqing va **C** ni bosing: doskada 9 ta oq nuqta birma-bir chiqadi.
   Ishlamasa **M** ni bosib, kamera tasvirida proyeksiyaning 4 burchagini bosing.
3. Tayyor. Kalibrovka `calibration.json` ga saqlanadi, keyingi safar o'zi yuklanadi.

### Tugmalar (SmartBoard oynasida)

| Tugma | Vazifa |
|---|---|
| C / M | avtomatik / qo'lda kalibrovka |
| H / P | qo'l rejimi / ruchka rejimi |
| SPACE yoki **F9** | boshqaruvni yoqish/o'chirish (F9 oyna yopiq bo'lsa ham ishlaydi) |
| T | ruchka chegarasini avtomatik sozlash (ruchkani olib turing) |
| - / + | ruchka yorug'lik chegarasi |
| [ / ] | kamera ekspozitsiyasi (ruchka rejimida pastroq qiling) |
| D | ruchka maskasini ko'rsatish (qizil = yorug' deb topilgan joy) |
| Q / ESC | chiqish |

Preview oynasi ham doskada ko'rinadi: ishlayotganda uni kichraytirib (minimize) qo'ying.

## Kamerani qayerga qo'yish

- **Eng yaxshisi: proyektor yoniga** (shiftga, linzaga yaqin, USB uzaytirgich bilan).
  Shunda kamera proyektor bilan bir xil burchakdan qaraydi: barmoq doskaga tegmasa ham
  kursor aynan barmoq ko'rsatgan joyda bo'ladi, odamning soyasi xalaqit bermaydi.
- Stolda turgan kamera ham ishlaydi, faqat barmoqni doskaga tekkizib turing.
- Noutbuk kamerasi faqat noutbuk qimirlamasa yaraydi.

## Ruchka (pen) rejimi uchun maslahat

- Eng arzon: **uchi bosilganda yonadigan LED/IR ruchka** ("IR pen 940nm", "Wiimote whiteboard pen")
  yoki o'zingiz yasang: LED + batareya + tugmacha marker korpusida.
- Kamera ekspozitsiyasini `[` tugmasi bilan pasaytiring: slayd xira, ruchka nuri yorqin ko'rinsin.
  Keyin **T** ni bosing.
- IR ruchka + IR filtrli kamera (yoki ko'rinadigan nurni to'suvchi plyonka) eng ishonchli
  variant: proyektor tasviri kameraga umuman ko'rinmaydi.
- `config.json` da `"pen_action": "dwell"` qilsangiz lazer ko'rsatkich bilan ham ishlaydi
  (nuqta = kursor, ushlab turish = bosish).

## Sozlamalar (`config.json`)

Birinchi ishga tushirishda yaratiladi. Muhimlari:

- `camera` — kamera raqami (`python smartboard.py --list` bilan ko'ring)
- `mode` — `hand` yoki `pen`
- `output` — `touch` (tavsiya), `mouse`, `none` (sinov)
- `dwell_time` — necha soniya ushlab turilsa bosiladi (0.8)
- `pinch_drag` — qisib surish (true/false)
- `screen_rect` — kengaytirilgan (Extend) rejimda proyektor ekrani: `[x, y, kenglik, balandlik]`

## Muammolar

| Muammo | Yechim |
|---|---|
| `no attribute 'solutions'` | eski kod. Shu dasturni ishlating (Tasks API) |
| Kalibrovkada nuqtalar topilmadi | xonani biroz qorong'iroq qiling, kamera 4 burchakni ko'rsin, yoki **M** |
| Kursor siljigan | kamera qimirlagan: **C** |
| Qo'l topilmayapti | xona chirog'ini yoqing, kamera qo'lni yaqinroqdan ko'rsin |
| Ruchka o'zi bosilyapti | **T** ni bosing yoki `[` bilan ekspozitsiyani pasaytiring |
| Kamera ochilmadi | boshqa dastur (Zoom, Telegram) kamerani band qilmaganini tekshiring, `--list` |
| mediapipe o'rnatilmaydi | Python 3.12 o'rnating; pen rejimi mediapipe'siz ham ishlaydi |

## Test

```bash
python test_simulation.py
```

Kamera va proyektorsiz sintetik sahnada kalibrovka, ruchka bosish/surish,
slayd almashishi, dwell-bosish va MediaPipe API ni tekshiradi.
