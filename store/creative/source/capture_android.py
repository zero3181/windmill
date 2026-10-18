"""Play 스토어 스크린샷 원본 (에뮬레이터): python3 capture_android.py <출력 폴더>"""
import os, subprocess, sys, time

OUT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
ADB = os.path.expanduser('~/Library/Android/sdk/platform-tools/adb')
PKG = 'com.zero3181.pungcha'
REMOTE = f'/data/data/{PKG}/files/SQLite'
LOCAL = f'{HERE}/android-db'
os.environ['ANDROID_SERIAL'] = 'emulator-5554'

# capture.py의 시드 데이터(SQL)만 가져온다
src = open(f'{HERE}/capture.py').read()
data = src[src.index('BANKS ='):src.index('def seed(')]
data = data.replace("DB = sh('xcrun', 'simctl', 'get_app_container', U, 'com.zero3181.pungcha', 'data').strip() + '/Documents/SQLite/pungcha.db'", '')
ns = {}
exec('import datetime, json\n' + data, ns)


def adb(*a):
    for _ in range(6):
        r = subprocess.run([ADB, *a], capture_output=True, text=True)
        if r.returncode == 0:
            return r.stdout
        time.sleep(1.5)
    return r.stdout


def seed(sql, onboarding=True, dark=False):
    adb('shell', 'am', 'force-stop', PKG)
    adb('shell', 'cmd', 'uimode', 'night', 'yes' if dark else 'no')
    os.makedirs(LOCAL, exist_ok=True)
    for f in ('pungcha.db-wal', 'pungcha.db-shm'):
        if os.path.exists(f'{LOCAL}/{f}'):
            os.remove(f'{LOCAL}/{f}')
    for f in ('pungcha.db', 'pungcha.db-wal', 'pungcha.db-shm'):
        adb('pull', f'{REMOTE}/{f}', f'{LOCAL}/{f}')
    head = "PRAGMA journal_mode=DELETE; DELETE FROM accounts; DELETE FROM settings;"
    if onboarding:
        head += "INSERT INTO settings(key,value) VALUES('onboardingDone','1');"
    subprocess.run(['sqlite3', f'{LOCAL}/pungcha.db', head + sql])
    adb('push', f'{LOCAL}/pungcha.db', f'{REMOTE}/pungcha.db')
    adb('shell', 'rm', '-f', f'{REMOTE}/pungcha.db-wal', f'{REMOTE}/pungcha.db-shm')
    uid = adb('shell', 'stat', '-c', '%u', f'/data/data/{PKG}').strip()
    adb('shell', 'chown', f'{uid}:{uid}', f'{REMOTE}/pungcha.db')
    adb('shell', 'am', 'start', '-n', f'{PKG}/.MainActivity')
    time.sleep(8)


def link(path):
    # 기기 셸이 & 를 해석하지 않도록 주소를 따옴표로 감싼 한 줄로 보낸다
    adb('shell', f"am start -a android.intent.action.VIEW -d 'pungcha://{path}' {PKG}")
    time.sleep(3.5)


def shot(name):
    adb('shell', 'screencap', '-p', '/sdcard/s.png')
    adb('pull', '/sdcard/s.png', f'{OUT}/{name}.png')
    print(name, flush=True)


import json, urllib.parse
pre = urllib.parse.quote(json.dumps({'type': 'savings', 'amount': 100000, 'termMonths': 12}, separators=(',', ':')))
adb('root')
time.sleep(2)
adb('shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1')
for cmd in (['enter'], ['clock', '-e', 'hhmm', '0941'], ['battery', '-e', 'level', '100', '-e', 'plugged', 'false'],
            ['network', '-e', 'wifi', 'show', '-e', 'level', '4'], ['notifications', '-e', 'visible', 'false']):
    adb('shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', *cmd)
seed(ns['COMPLETE']); shot('1_complete')
seed(ns['PROGRESS']); link('guide'); shot('2_guide')
seed(ns['PROGRESS']); shot('3_progress')
seed(ns['DEPOSIT']); shot('4_deposit')
seed(''); link('create-windmill'); shot('5_create')
seed(ns['PROGRESS']); link('add-account?step=7&prefill=' + pre); shot('6_join')
seed(ns['PROGRESS']); link('rates'); time.sleep(8); shot('7_rates')
adb('shell', 'cmd', 'uimode', 'night', 'no')
