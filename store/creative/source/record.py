"""앱 미리보기 영상 촬영: python3 record.py <UDID> <out.mov>"""
import os, signal, subprocess, sys, time

sys.argv_backup = list(sys.argv)
U, VIDEO = sys.argv[1], sys.argv[2]
sys.argv = [sys.argv[0], U, '/dev/null']
# capture.py의 데이터와 도우미를 다시 쓴다 (촬영 부분은 실행하지 않도록 소스에서 잘라 읽는다)
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'capture.py')).read()
exec(src.split("pre = urllib")[0])


def tapxy(x, y, wait=1.6):
    sh('axe', 'tap', '-x', str(x), '-y', str(y), '--tap-style', 'physical', '--udid', U)
    time.sleep(wait)


def tapl(label, wait=1.6):
    sh('axe', 'tap', '--label', label, '--tap-style', 'physical', '--udid', U)
    time.sleep(wait)


def swipe(y1, y2, wait=1.4):
    sh('axe', 'swipe', '--start-x', '220', '--start-y', str(y1), '--end-x', '220', '--end-y', str(y2), '--duration', '0.6', '--udid', U)
    time.sleep(wait)


both = PROGRESS.replace("INSERT INTO settings(key,value) VALUES('stepReminder.savings','2026-10-20');", '') + DEPOSIT
seed(both)
time.sleep(1)

rec = subprocess.Popen(['xcrun', 'simctl', 'io', U, 'recordVideo', '--codec', 'h264', '--force', VIDEO],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(2.2)                       # 홈: 풍차와 할 일
tapl('풍차', 2.2)                      # 날개마다 월 이름
tapl('7, 7번째 적금을 가입하세요, 10월 가입 알림 받기', 1.6)  # 가입 기록 시트
tapl('은행, 선택', 1.0)
tapl('신한은행', 0.8)
tapl('저장', 3.2)                      # 날개가 채워지고 토스트
tapl('예금 풍차', 2.4)                 # 석양으로 바뀜
tapl('더 보기', 1.0)
tapl('풍차돌리기란?', 1.8)
swipe(800, 300, 2.4)
swipe(800, 300, 2.4)
time.sleep(0.8)
rec.send_signal(signal.SIGINT)
rec.wait()
print('recorded', VIDEO)
