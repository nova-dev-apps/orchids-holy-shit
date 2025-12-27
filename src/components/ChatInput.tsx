import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, Paperclip, Plus, Square, Download } from "lucide-react";
import { AttachmentPreview } from "./AttachmentPreview";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'video' | 'audio' | 'document';
  preview: string;
  name: string;
  size: number;
}

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: (message: string, attachments: Attachment[]) => void;
  placeholder: string;
  disabled?: boolean;
  hideAttachments?: boolean;
  activeTab?: string;
  onAutoModeToggle?: (isActive: boolean) => void;
  isGenerating?: boolean;
  onStop?: () => void;
}

export const ChatInput = ({ message, setMessage, onSend, placeholder, disabled, hideAttachments, activeTab, onAutoModeToggle, isGenerating, onStop }: ChatInputProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAutoActive, setIsAutoActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth < 768;
  };

  const getFileType = (file: File): Attachment['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const newAttachments: Attachment[] = [];

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is 20MB.`,
          variant: "destructive"
        });
        continue;
      }

      const fileType = getFileType(file);
      let preview = '';

      try {
        if (fileType === 'image' || fileType === 'video') {
          preview = URL.createObjectURL(file);
        }

        newAttachments.push({
          id: Date.now().toString() + Math.random(),
          file,
          type: fileType,
          preview,
          name: file.name,
          size: file.size
        });
      } catch (error) {
        toast({
          title: "Error processing file",
          description: `Could not process ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment?.preview && (attachment.type === 'image' || attachment.type === 'video')) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend(message, attachments);
      setMessage("");
      attachments.forEach(attachment => {
        if (attachment.preview && (attachment.type === 'image' || attachment.type === 'video')) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-0.5">
      {attachments.length > 0 && !hideAttachments && (
        <div className="mb-3">
          <AttachmentPreview
            attachments={attachments}
            onRemove={removeAttachment}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        {!hideAttachments && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="More options"
              >
                <Plus className="w-5 h-5 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
                <span>Attachment</span>
              </DropdownMenuItem>
              {activeTab === 'chat' && (
                <DropdownMenuItem
                  onClick={() => {
                    if (isMobileDevice()) {
                      toast({
                        title: "Not available for phones",
                        description: "",
                        variant: "default",
                        duration: 3000,
                      });
                      return;
                    }
                    const newState = !isAutoActive;
                    setIsAutoActive(newState);
                    onAutoModeToggle?.(newState);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                  data-testid="menu-item-auto-mode"
                >
                  <div className={`w-2 h-2 rounded-full ${isAutoActive ? 'bg-nova-pink' : 'bg-gray-400'}`} />
                  <span>Auto Mode</span>
                  {isAutoActive && <span className="ml-auto text-xs text-nova-pink">On</span>}
                </DropdownMenuItem>
              )}
                        {activeTab === 'chat' && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (isMobileDevice()) {
                                  toast({
                                    title: "Desktop only",
                                    description: "The local agent is only available for desktop.",
                                    variant: "default",
                                    duration: 3000,
                                  });
                                  return;
                                }
                                
                                const ps1Content = `# Nova Agent One-Click Installer
$ErrorActionPreference = "Stop"
Write-Host "Nova Agent Installer" -ForegroundColor Cyan
try {
    $p = (Get-Command python -EA SilentlyContinue).Source
    Write-Host "Python found" -ForegroundColor Green
} catch {
    Write-Host "Installing Python..." -ForegroundColor Yellow
    $u = "https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe"
    Invoke-WebRequest -Uri $u -OutFile "$env:TEMP\\py.exe"
    Start-Process "$env:TEMP\\py.exe" "/quiet PrependPath=1" -Wait
    $env:Path = [Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [Environment]::GetEnvironmentVariable("Path","User")
}
$d = "$env:TEMP\\nova-build"
Remove-Item $d -Recurse -Force -EA SilentlyContinue
mkdir $d | Out-Null
python -m pip install pyinstaller pyperclip -q
@'
import json,os,subprocess,threading,webbrowser,pyperclip
from http.server import BaseHTTPRequestHandler,HTTPServer
import tkinter as tk
from tkinter import messagebox,ttk
CF="nova_consent.accepted"
PORT=5050
ae=False
sr=False
def consent():
    if os.path.exists(CF):return True
    r=tk.Tk();r.title("Nova Agent Setup");r.geometry("520x380");r.resizable(0,0);r.configure(bg="#0a0a0a")
    a=tk.BooleanVar();res={"c":False}
    tk.Label(r,text="Nova Local Agent",font=("Segoe UI",18,"bold"),bg="#0a0a0a",fg="white").pack(pady=(20,5))
    tk.Label(r,text="Your Automation Partner",font=("Segoe UI",10),bg="#0a0a0a",fg="#888").pack(pady=(0,20))
    f=tk.Frame(r,bg="#1a1a1a",padx=20,pady=15);f.pack(padx=20,fill="x")
    tk.Label(f,text="This agent will:",font=("Segoe UI",10,"bold"),bg="#1a1a1a",fg="white",anchor="w").pack(fill="x")
    for p in["Execute automation plans","Access files","Copy/paste clipboard","Open URLs/apps","Run commands"]:tk.Label(f,text="* "+p,font=("Segoe UI",9),bg="#1a1a1a",fg="#ccc",anchor="w").pack(fill="x",pady=1)
    tk.Label(r,text="You control everything. Close app to stop.",font=("Segoe UI",9),bg="#0a0a0a",fg="#666").pack(pady=15)
    cb=tk.Checkbutton(r,text="I consent to run this agent",variable=a,bg="#0a0a0a",fg="white",selectcolor="#333",font=("Segoe UI",10));cb.pack()
    def ok():
        if a.get():open(CF,"w").write("ok");res["c"]=True;r.destroy()
        else:messagebox.showerror("Required","Check consent box")
    bf=tk.Frame(r,bg="#0a0a0a");bf.pack(pady=20)
    tk.Button(bf,text="Decline",command=r.destroy,width=12,bg="#333",fg="white",relief="flat").pack(side="left",padx=5)
    tk.Button(bf,text="Accept",command=ok,width=15,bg="#3b82f6",fg="white",relief="flat",font=("Segoe UI",10,"bold")).pack(side="left",padx=5)
    r.mainloop();return res["c"]
def exe(s):
    global sr
    if sr:return{"step":s,"status":"stopped"}
    a=s.get("action","").lower();p=s.get("params",{})
    try:
        if a=="open_url":webbrowser.open(p.get("url",""));return{"step":s,"status":"done"}
        elif a=="open_app":os.startfile(p.get("app","")) if os.name=="nt" else subprocess.Popen([p.get("app","")]);return{"step":s,"status":"done"}
        elif a=="copy_to_clipboard":pyperclip.copy(p.get("text",""));return{"step":s,"status":"done"}
        elif a=="read_file":return{"step":s,"status":"done","result":open(p.get("path",""),"r").read()[:1000]}
        elif a=="write_file":open(p.get("path",""),"w").write(p.get("content",""));return{"step":s,"status":"done"}
        elif a=="list_files":return{"step":s,"status":"done","result":os.listdir(p.get("path","."))}
        elif a=="run_command":r=subprocess.run(p.get("command",""),shell=1,capture_output=1,text=1,timeout=30);return{"step":s,"status":"done","result":r.stdout or r.stderr}
        elif a=="wait":import time;time.sleep(p.get("seconds",1));return{"step":s,"status":"done"}
        return{"step":s,"status":"error","error":"Unknown: "+a}
    except Exception as e:return{"step":s,"status":"error","error":str(e)}
class H(BaseHTTPRequestHandler):
    def cors(s):s.send_header("Access-Control-Allow-Origin","*");s.send_header("Access-Control-Allow-Methods","GET,POST,OPTIONS");s.send_header("Access-Control-Allow-Headers","Content-Type")
    def do_OPTIONS(s):s.send_response(200);s.cors();s.end_headers()
    def do_GET(s):
        if s.path=="/status":s.send_response(200);s.send_header("Content-Type","application/json");s.cors();s.end_headers();s.wfile.write(json.dumps({"status":"running","automation_enabled":ae}).encode())
        else:s.send_response(404);s.end_headers()
    def do_POST(s):
        global sr
        if s.path=="/execute":
            if not ae:s.send_response(403);s.send_header("Content-Type","application/json");s.cors();s.end_headers();s.wfile.write(json.dumps({"error":"disabled"}).encode());return
            b=s.rfile.read(int(s.headers.get("Content-Length",0)));st=json.loads(b).get("steps",[]);sr=False;res=[exe(x) for x in st]
            s.send_response(200);s.send_header("Content-Type","application/json");s.cors();s.end_headers();s.wfile.write(json.dumps({"status":"done","results":res}).encode())
        elif s.path=="/stop":sr=True;s.send_response(200);s.send_header("Content-Type","application/json");s.cors();s.end_headers();s.wfile.write(json.dumps({"status":"stopped"}).encode())
        else:s.send_response(404);s.end_headers()
    def log_message(s,*a):pass
def srv():HTTPServer(("localhost",PORT),H).serve_forever()
def ui():
    global ae,sr
    r=tk.Tk();r.title("Nova Agent");r.geometry("300x200");r.resizable(0,0);r.configure(bg="#0a0a0a")
    tk.Label(r,text="Nova Agent",font=("Segoe UI",14,"bold"),bg="#0a0a0a",fg="white").pack(pady=(15,5))
    st=tk.Label(r,text="Status: Idle",font=("Segoe UI",10),bg="#0a0a0a",fg="#888");st.pack()
    def tog():
        global ae;ae=not ae
        tb.configure(text="Disable" if ae else "Enable",bg="#ef4444" if ae else "#3b82f6")
        st.configure(text="ACTIVE" if ae else "Idle",fg="#22c55e" if ae else "#888")
    def stp():global sr;sr=True;st.configure(text="Stopped",fg="#f59e0b")
    tb=tk.Button(r,text="Enable",command=tog,width=20,bg="#3b82f6",fg="white",relief="flat",font=("Segoe UI",10,"bold"));tb.pack(pady=15)
    tk.Button(r,text="Stop Task",command=stp,width=20,bg="#333",fg="white",relief="flat").pack()
    tk.Label(r,text=f"localhost:{PORT}",font=("Segoe UI",8),bg="#0a0a0a",fg="#555").pack(pady=15)
    r.protocol("WM_DELETE_WINDOW",lambda:(r.destroy(),os._exit(0)));r.mainloop()
if __name__=="__main__":
    if not consent():exit(0)
    threading.Thread(target=srv,daemon=1).start();ui()
'@ | Out-File "$d\\agent.py" -Encoding utf8
Push-Location $d
python -m PyInstaller --onefile --noconsole --name NovaAgent agent.py 2>&1 | Out-Null
Pop-Location
$desk = [Environment]::GetFolderPath("Desktop")
if (Test-Path "$d\\dist\\NovaAgent.exe") {
    Copy-Item "$d\\dist\\NovaAgent.exe" "$desk\\NovaAgent.exe" -Force
    Write-Host "SUCCESS! NovaAgent.exe on Desktop" -ForegroundColor Green
    Start-Process "$desk\\NovaAgent.exe"
} else { Write-Host "Build failed" -ForegroundColor Red }
Remove-Item $d -Recurse -Force -EA SilentlyContinue
`;
                                
                                // Use postMessage to open in external tab (works in iframe)
                                const dataUri = 'data:application/octet-stream;base64,' + btoa(unescape(encodeURIComponent(ps1Content)));
                                
                                // Method: Open new tab with data URI, triggers download
                                window.parent.postMessage({ 
                                  type: "OPEN_EXTERNAL_URL", 
                                  data: { url: dataUri } 
                                }, "*");
                                
                                // Fallback: Also try direct window.open
                                const newTab = window.open('', '_blank');
                                if (newTab) {
                                  newTab.document.write(`
                                    <html><head><title>Download</title></head><body>
                                    <script>
                                      const content = ${JSON.stringify(ps1Content)};
                                      const blob = new Blob([content], {type: 'application/octet-stream'});
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = 'Install-NovaAgent.ps1';
                                      document.body.appendChild(a);
                                      a.click();
                                      setTimeout(() => window.close(), 1000);
                                    </script>
                                    <p>Downloading... This tab will close automatically.</p>
                                    </body></html>
                                  `);
                                  newTab.document.close();
                                }
                                
                                toast({
                                  title: "Downloading...",
                                  description: "Right-click file → Run with PowerShell",
                                  duration: 6000,
                                });
                              }}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-nova-pink" />
                              <span className="font-medium">Download Agent</span>
                            </DropdownMenuItem>
                          )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className={`flex-1 relative ${isAutoActive ? 'auto-mode-glow' : ''}`}>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
            }}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full min-h-[48px] max-h-[200px] py-3 px-4 pr-12 rounded-3xl border focus:outline-none text-sm resize-none overflow-y-auto ${!isAutoActive ? 'border-gray-200 focus:border-gray-300' : ''}`}
            style={{ height: 'auto' }}
            data-testid={isAutoActive ? 'textarea-auto-mode' : 'textarea-normal'}
          />
          <button
            onClick={isGenerating ? onStop : handleSend}
            disabled={!isGenerating && (!message.trim() && attachments.length === 0 || disabled)}
            className="absolute right-4 p-0 flex items-center justify-center hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ top: 'calc(33.333% - 4px)' }}
            aria-label={isGenerating ? "Stop generation" : "Send message"}
          >
            {isGenerating ? (
              <Square className="w-5 h-5 text-red-600 fill-red-600" />
            ) : (
              <ArrowUp className="w-5 h-5 text-black" />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          aria-label="File input"
        />
      </div>
    </div>
  );
};
