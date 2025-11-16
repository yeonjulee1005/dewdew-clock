import * as vscode from 'vscode';
import * as path from 'path';

export class ClockViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'dewdew-clock.clockView';

  private _view?: vscode.WebviewView;
  private _updateInterval?: NodeJS.Timeout;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // 1초마다 시간 업데이트
    this._updateInterval = setInterval(() => {
      if (this._view) {
        this._view.webview.postMessage({
          type: 'update',
          time: this._getCurrentTime()
        });
      }
    }, 1000);
  }

  private _getCurrentTime() {
    const now = new Date();
    const locale = vscode.env.language || undefined;
    
    return {
      hours: String(now.getHours()).padStart(2, '0'),
      minutes: String(now.getMinutes()).padStart(2, '0'),
      seconds: String(now.getSeconds()).padStart(2, '0'),
      date: now.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    };
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const initialTime = this._getCurrentTime();
    
    // Orbitron 폰트 파일 경로
    const fontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'assets', 'fonts', 'Orbitron-VariableFont_wght.ttf')
    );

    return `<!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DewDew Clock</title>
      <style>
        @font-face {
          font-family: 'Orbitron';
          src: url('${fontUri}') format('truetype');
          font-weight: 100 900;
          font-style: normal;
          font-display: swap;
        }

        body {
          margin: 0;
          padding: 16px 40px;
          min-height: 150px;
          height: auto;
          color: var(--vscode-foreground);
          background-color: var(--vscode-sideBar-background);
          font-family: var(--vscode-font-family);
          overflow: hidden;
        }
        
        html {
          height: auto;
          overflow: hidden;
        }

        .clock-container {
          text-align: center;
        }

        .time {
          font-weight: 900;
          font-family: 'Orbitron', monospace;
          margin: 10px 0;
          white-space: nowrap;
          overflow: hidden;
          letter-spacing: 0.5px;
        }

        .date {
          font-size: 16px;
          opacity: 0.8;
          margin-bottom: 20px;
        }

        .divider {
          display: none;
          border-top: 1px solid var(--vscode-panel-border);
          margin: 16px 0;
        }

        .info-section {
          display: none;
          margin-top: 16px;
          font-size: 12px;
          opacity: 0.6;
        }

        .info-item {
          display: none;
          padding: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="clock-container">
        <div class="time" id="time">${initialTime.hours} : ${initialTime.minutes} : ${initialTime.seconds}</div>
        <div class="date" id="date">${initialTime.date}</div>

        <div class="divider"></div>

        <div class="info-section">
          <div class="info-item">📊 Coding Time: Coming Soon</div>
          <div class="info-item">✅ Today's Work: Coming Soon</div>
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();
        const timeElement = document.getElementById('time');
        const dateElement = document.getElementById('date');
        const container = document.querySelector('.clock-container');
        let lastWidth = -1;
        let isAdjusting = false;
        let debounceTimer = null;
        
        // 초기 높이 설정 (한 번만 실행)
        function setInitialHeight() {
          if (!container || !timeElement || !dateElement) return;
          
          // 폰트 로딩 후 높이 측정
          requestAnimationFrame(() => {
            setTimeout(() => {
              // 강제 리플로우
              void container.offsetHeight;
              void timeElement.offsetHeight;
              void dateElement.offsetHeight;
              
              // 컨텐츠 높이 측정
              const timeRect = timeElement.getBoundingClientRect();
              const dateRect = dateElement.getBoundingClientRect();
              
              // 실제 컨텐츠 높이 계산 (margin 포함)
              const contentHeight = timeRect.height + dateRect.height + 10 + 20; // margin 포함
              const bodyHeight = contentHeight + 32; // 상하 패딩 16px * 2
              
              // 초기 높이 설정 시도
              document.body.style.height = bodyHeight + 'px';
              document.body.style.minHeight = bodyHeight + 'px';
            }, 500); // 폰트 로딩 대기
          });
        }
        
        // 숨겨진 측정 요소 생성 (한 번만)
        let measureElement = null;
        function getMeasureElement() {
          if (!measureElement) {
            measureElement = document.createElement('div');
            measureElement.style.position = 'absolute';
            measureElement.style.visibility = 'hidden';
            measureElement.style.whiteSpace = 'nowrap';
            measureElement.style.fontFamily = 'Orbitron, monospace';
            measureElement.style.fontWeight = '900';
            measureElement.style.top = '-9999px';
            measureElement.style.left = '-9999px';
            document.body.appendChild(measureElement);
          }
          return measureElement;
        }
        
        // 실제 DOM 요소를 사용하여 텍스트 너비 측정 (가장 정확함)
        function measureActualTextWidth(text, fontSize) {
          const measureEl = getMeasureElement();
          measureEl.textContent = text;
          measureEl.style.fontSize = fontSize + 'px';
          
          // 강제 리플로우
          void measureEl.offsetHeight;
          
          // 실제 렌더링된 너비 측정
          return measureEl.getBoundingClientRect().width;
        }
        
        function adjustFontSize() {
          if (!timeElement || isAdjusting) return;
          
          // 디바운싱: 100ms 이내의 연속 호출 무시 (더 길게)
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }
          
          debounceTimer = setTimeout(() => {
            isAdjusting = true;
            
            // requestAnimationFrame으로 다음 프레임에 실행하여 리플로우 보장
            requestAnimationFrame(() => {
              try {
                // body의 실제 너비 사용 (CSS padding 40px 고려)
                const bodyRect = document.body.getBoundingClientRect();
                const bodyPadding = 80; // 좌우 40px씩 (총 80px)
                const availableWidth = bodyRect.width - bodyPadding;
                
                if (availableWidth <= 0) {
                  isAdjusting = false;
                  return;
                }
                
                // 크기가 변경되지 않았으면 스킵 (더 큰 임계값 사용)
                if (Math.abs(lastWidth - availableWidth) < 3) {
                  isAdjusting = false;
                  return;
                }
                
                lastWidth = availableWidth;
                
                // 현재 텍스트 내용 가져오기
                const text = timeElement.textContent || '';
                if (!text) {
                  isAdjusting = false;
                  return;
                }
                
                // 여유 공간을 더 크게 설정 (안전 마진)
                const safetyMargin = 20; // 20px 여유 공간
                const targetWidth = availableWidth - safetyMargin;
                
                if (targetWidth <= 0) {
                  isAdjusting = false;
                  return;
                }
                
                // 이진 탐색으로 최적의 폰트 크기 찾기 (실제 DOM 측정 사용)
                let minSize = 12;
                let maxSize = 600;
                let bestSize = 36;
                
                // 이진 탐색으로 정확한 크기 찾기
                for (let i = 0; i < 50; i++) {
                  const testSize = Math.floor((minSize + maxSize) / 2);
                  
                  // 실제 DOM 요소로 정확한 너비 측정
                  const textWidth = measureActualTextWidth(text, testSize);
                  
                  if (textWidth <= targetWidth) {
                    bestSize = testSize;
                    minSize = testSize + 1;
                  } else {
                    maxSize = testSize - 1;
                  }
                  
                  if (minSize > maxSize) break;
                }
                
                // 최종 폰트 크기 적용
                timeElement.style.fontSize = bestSize + 'px';
                
                // 한 번만 최종 검증
                requestAnimationFrame(() => {
                  // 강제 리플로우
                  void timeElement.offsetHeight;
                  
                  // 실제 렌더링된 텍스트 너비 측정
                  const actualRect = timeElement.getBoundingClientRect();
                  const actualWidth = actualRect.width;
                  
                  // 여전히 초과하면 보수적으로 조정
                  if (actualWidth > availableWidth && bestSize > 12) {
                    const ratio = availableWidth / actualWidth;
                    const adjustedSize = Math.max(12, Math.floor(bestSize * ratio * 0.95)); // 95%로 더 보수적
                    timeElement.style.fontSize = adjustedSize + 'px';
                  }
                  
                  isAdjusting = false;
                });
              } catch (e) {
                console.error('Font size adjustment error:', e);
                isAdjusting = false;
              }
            });
          }, 100);
        }
        
        // 초기화
        function init() {
          // 폰트 로딩 완료 대기
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
              setTimeout(() => {
                adjustFontSize();
                setInitialHeight(); // 초기 높이 설정
              }, 150);
            });
          } else {
            setTimeout(() => {
              adjustFontSize();
              setInitialHeight(); // 초기 높이 설정
            }, 300);
          }
        }
        
        // DOM 로드 완료 대기
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', init);
        } else {
          init();
        }
        
        // ResizeObserver로 body만 관찰 (container는 body 내부이므로 불필요)
        const resizeObserver = new ResizeObserver(() => {
          adjustFontSize();
        });
        
        resizeObserver.observe(document.body);
        
        // 윈도우 리사이즈 감지
        window.addEventListener('resize', () => {
          adjustFontSize();
        });

        window.addEventListener('message', event => {
          const message = event.data;

          if (message.type === 'update') {
            const time = message.time;
            // 띄어쓰기 포함하여 업데이트
            if (timeElement) {
              timeElement.textContent =
                time.hours + ' : ' + time.minutes + ' : ' + time.seconds;
            }
            const dateElement = document.getElementById('date');
            if (dateElement) {
              dateElement.textContent = time.date;
            }
            // 시간 업데이트 후 폰트 크기 재조정 (디바운싱이 적용됨)
            adjustFontSize();
          }
        });
      </script>
    </body>
    </html>`;
  }

  public dispose() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
    }
  }
}
