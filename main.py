import os
import sys
import threading
import http.server
import socketserver
import webview

PORT = 8000

def start_server():
    # Mengarahkan path agar bisa membaca file saat sudah menjadi .exe
    if getattr(sys, 'frozen', False):
        os.chdir(sys._MEIPASS)
    else:
        os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    Handler = http.server.SimpleHTTPRequestHandler
    Handler.log_message = lambda *args, **kwargs: None # Sembunyikan log terminal
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

if __name__ == '__main__':
    # 1. Nyalakan server di background
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()
    
    # 2. Buka jendela aplikasi desktop
    webview.create_window('Voxel AR Puzzle', f'http://localhost:{PORT}', width=1280, height=720)
    webview.start()