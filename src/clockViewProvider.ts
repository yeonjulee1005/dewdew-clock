import * as vscode from 'vscode';

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
    return {
      hours: String(now.getHours()).padStart(2, '0'),
      minutes: String(now.getMinutes()).padStart(2, '0'),
      seconds: String(now.getSeconds()).padStart(2, '0'),
      date: now.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    };
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const initialTime = this._getCurrentTime();

    return `<!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DewDew Clock</title>
      <style>
        body {
          margin: 0;
          padding: 16px;
          color: var(--vscode-foreground);
          background-color: var(--vscode-sideBar-background);
          font-family: var(--vscode-font-family);
        }

        .clock-container {
          text-align: center;
        }

        .time {
          font-size: 36px;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          margin: 20px 0;
        }

        .date {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 20px;
        }

        .divider {
          border-top: 1px solid var(--vscode-panel-border);
          margin: 16px 0;
        }

        .info-section {
          margin-top: 16px;
          font-size: 12px;
          opacity: 0.6;
        }

        .info-item {
          padding: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="clock-container">
        <div class="time" id="time">${initialTime.hours}:${initialTime.minutes}:${initialTime.seconds}</div>
        <div class="date" id="date">${initialTime.date}</div>

        <div class="divider"></div>

        <div class="info-section">
          <div class="info-item">📊 코딩 시간: 준비중</div>
          <div class="info-item">✅ 오늘 작업: 준비중</div>
        </div>
      </div>

      <script>
        const vscode = acquireVsCodeApi();

        window.addEventListener('message', event => {
          const message = event.data;

          if (message.type === 'update') {
            const time = message.time;
            document.getElementById('time').textContent =
              time.hours + ':' + time.minutes + ':' + time.seconds;
            document.getElementById('date').textContent = time.date;
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
