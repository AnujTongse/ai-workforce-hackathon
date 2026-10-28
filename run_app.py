import os
import sys
import webbrowser
import threading
import time

def open_browser():
    time.sleep(1.8)
    url = "http://localhost:8000"
    print(f"\n[AI Workforce] Opening application in browser: {url}")
    try:
        webbrowser.open(url)
    except Exception:
        pass

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(current_dir, "backend")
    
    os.chdir(backend_dir)
    sys.path.insert(0, backend_dir)
    
    import uvicorn
    
    print("=" * 70)
    print("  AI WORKFORCE FOR BUSINESSES - MULTI-AGENT ORCHESTRATION MVP")
    print("=" * 70)
    print("  Status: Core Services & Role-Based Agents Initialized")
    print("  Web Dashboard:      http://localhost:8000")
    print("  Interactive Docs:   http://localhost:8000/docs")
    print("=" * 70)
    print("  Press Ctrl+C to stop the service.\n")

    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
