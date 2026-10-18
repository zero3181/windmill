"""캡션 붙인 스토어 스크린샷: python3 compose.py iphone|ipad"""
import os, subprocess, sys

DEV = sys.argv[1]
A = os.path.dirname(os.path.abspath(__file__))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
SKY = 'linear-gradient(180deg,#9FD2FF 0%,#D2EAFF 45%,#F2F6FB 100%)'
SUNSET = 'linear-gradient(180deg,#FFAE84 0%,#FFD5C2 45%,#FCF0EA 100%)'
NIGHT = 'linear-gradient(180deg,#123A66 0%,#08172B 45%,#000000 100%)'
SLIDES = [
    ('1_complete', '매달 만기가 돌아오는', '나만의 풍차', SKY, '#0B1B2B', '#0071E3'),
    ('2_guide', '풍차돌리기가 처음이어도', '그림으로 쉽게 알려드려요', SKY, '#0B1B2B', '#0071E3'),
    ('3_progress', '이번 달 할 일만', '따라 하면 돼요', SKY, '#0B1B2B', '#0071E3'),
    ('4_deposit', '날개 하나가', '만기 한 달이에요', SUNSET, '#2B1608', '#D9480F'),
    ('5_create', '날개 수와 금액만', '정하면 시작', SKY, '#0B1B2B', '#0071E3'),
    ('6_join', '어떤 조건으로 가입할지', '바로 알려드려요', SKY, '#0B1B2B', '#0071E3'),
    ('7_dark', '밤에도 눈 편하게', 'Face ID로 안전하게', NIGHT, '#FFFFFF', '#5CB2FF'),
]
if DEV == 'iphone':
    W, H, top, size, dev_top, dev_w, radius, border = 1320, 2868, 210, 104, 640, 1080, 120, 14
else:
    W, H, top, size, dev_top, dev_w, radius, border = 2064, 2752, 170, 120, 560, 1700, 70, 22

out = f'{A}/out-{DEV}'
os.makedirs(out, exist_ok=True)
for name, l1, l2, bg, fg, ac in SLIDES:
    frame = '#2A2D33' if bg == NIGHT else '#111111'
    html = f'''<html><head><meta charset="utf-8"><style>
html,body{{margin:0;width:{W}px;height:{H}px;overflow:hidden;background:{bg};font-family:"Apple SD Gothic Neo",-apple-system,sans-serif}}
.cap{{position:absolute;top:{top}px;width:100%;text-align:center;color:{fg};font-weight:800;font-size:{size}px;line-height:1.25;letter-spacing:-3px}}
.cap span{{color:{ac}}}
.dev{{position:absolute;top:{dev_top}px;left:50%;transform:translateX(-50%);width:{dev_w}px;border-radius:{radius}px;overflow:hidden;
  box-shadow:0 40px 120px rgba(0,0,0,.22);border:{border}px solid {frame}}}
.dev img{{display:block;width:100%}}
</style></head><body><div class="cap">{l1}<br><span>{l2}</span></div>
<div class="dev"><img src="../raw-{DEV}/{name}.png"></div></body></html>'''
    page = f'{out}/{name}.html'
    open(page, 'w').write(html)
    tmp = f'{out}/{name}.tmp.png'
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    f'--window-size={W},{H}', f'--screenshot={tmp}', f'file://{page}'], capture_output=True)
    # 알파 채널 없이 RGB로 저장
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-pix_fmt', 'rgb24', f'{out}/{name}.png'])
    os.remove(tmp)
    os.remove(page)
    print(name)
