"""스토어 스크린샷 원본 촬영: python3 capture.py <UDID> <출력 폴더>"""
import datetime, json, subprocess, sys, time, urllib.parse

U, OUT = sys.argv[1], sys.argv[2]
BANKS = ['토스뱅크', '카카오뱅크', 'KB국민은행', '신한은행', '하나은행', '우리은행', 'SBI저축은행', 'OK저축은행', '웰컴저축은행', 'NH농협은행', '케이뱅크', 'IBK기업은행']
RATES = [4.2, 4.1, 4.0, 3.9, 4.2, 3.8, 4.0, 4.1, 3.9, 4.0, 3.8, 4.2]


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True).stdout


DB = sh('xcrun', 'simctl', 'get_app_container', U, 'com.zero3181.pungcha', 'data').strip() + '/Documents/SQLite/pungcha.db'


def addm(d, k):
    y = d.year + (d.month - 1 + k) // 12
    m = (d.month - 1 + k) % 12 + 1
    return datetime.date(y, m, min(d.day, 28))


def acc(i, typ, start, term, amount):
    mat = addm(start, term)
    unit = '적금' if typ == 'savings' else '예금'
    pay = start.day if typ == 'savings' else 'NULL'
    return (f"INSERT INTO accounts VALUES('{typ}{i}','{start.month}월 {unit}','{BANKS[i % 12]}','{typ}',{amount},{RATES[i % 12]},"
            f"'general','{start}',{term},'{mat}',{pay},'active',NULL,'2026-01-01T00:00:00Z','2026-01-01T00:00:00Z');")


def goal(typ, blades, total):
    return f"INSERT INTO settings(key,value) VALUES('goal.{typ}','{json.dumps({'blades': blades, 'total': total})}');"


COMPLETE = goal('savings', 12, 1200000) + ''.join(acc(i, 'savings', addm(datetime.date(2025, 11, 10), i), 12, 100000) for i in range(12))
PROGRESS_STARTS = [datetime.date(2026, m, 10) for m in (3, 4, 6, 7, 8, 9)]
PROGRESS = (goal('savings', 12, 1200000) + ''.join(acc(i, 'savings', d, 12, 100000) for i, d in enumerate(PROGRESS_STARTS))
            + "INSERT INTO settings(key,value) VALUES('stepReminder.savings','2026-10-20');")
DEPOSIT_STARTS = [datetime.date(2026, m, 5) for m in (2, 3, 5, 6, 8, 9)]
DEPOSIT = goal('deposit', 12, 12000000) + ''.join(acc(i, 'deposit', d, 12, 1000000) for i, d in enumerate(DEPOSIT_STARTS))


def seed(sql, onboarding=True, dark=False):
    sh('xcrun', 'simctl', 'terminate', U, 'com.zero3181.pungcha')
    sh('xcrun', 'simctl', 'ui', U, 'appearance', 'dark' if dark else 'light')
    head = "DELETE FROM accounts; DELETE FROM settings;"
    if onboarding:
        head += "INSERT INTO settings(key,value) VALUES('onboardingDone','1');"
    sh('sqlite3', DB, head + sql)
    sh('xcrun', 'simctl', 'status_bar', U, 'override', '--time', '9:41', '--batteryState', 'charged', '--batteryLevel', '100',
       '--cellularMode', 'active', '--cellularBars', '4', '--wifiBars', '3', '--operatorName', '')
    sh('xcrun', 'simctl', 'launch', U, 'com.zero3181.pungcha')
    time.sleep(7)


def link(path):
    sh('xcrun', 'simctl', 'openurl', U, 'pungcha://' + path)
    time.sleep(1.5)
    sh('axe', 'tap', '--label', '열기', '--tap-style', 'physical', '--udid', U)
    time.sleep(3)


def tap(label):
    sh('axe', 'tap', '--label', label, '--tap-style', 'physical', '--udid', U)
    time.sleep(2)


def shot(name):
    sh('xcrun', 'simctl', 'io', U, 'screenshot', f'{OUT}/{name}.png')
    print(name, flush=True)


pre = urllib.parse.quote(json.dumps({'type': 'savings', 'amount': 100000, 'termMonths': 12}, separators=(',', ':')))
seed(COMPLETE); shot('1_complete')
seed(PROGRESS); link('guide'); shot('2_guide')
seed(PROGRESS); shot('3_progress')
seed(DEPOSIT); shot('4_deposit')
seed(''); link('create-windmill'); shot('5_create')
seed(PROGRESS); link('add-account?step=7&prefill=' + pre); shot('6_join')
seed(PROGRESS, dark=True); shot('7_dark')
sh('xcrun', 'simctl', 'ui', U, 'appearance', 'light')
