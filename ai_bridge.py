import asyncio
import websockets
import subprocess
import json
import psutil
import sys
import os

# --- CONFIGURATION ---
# PLEASE CONFIGURE THESE PATHS
AI_ENGINE_PATH = r"e:\antigra-demo\gotrianing\ai_engine\katago.exe"
MODEL_PATH = r"e:\antigra-demo\gotrianing\ai_engine\model.bin"
CONFIG_PATH = r"e:\antigra-demo\gotrianing\ai_engine\default_gtp.cfg"
# ---------------------

async def run_ai_bridge():
    print(f"Starting AI Bridge on ws://localhost:3001")
    
    # Verify Engine Exists
    if not os.path.exists(AI_ENGINE_PATH):
        print(f"ERROR: AI Engine not found at: {AI_ENGINE_PATH}")
        print("Please download KataGo OpenCL version and place it in the 'ai_engine' folder.")
        return

    # Start KataGo Process (GTP Mode)
    # Command: katago.exe gtp -model model.bin.gz -config default_gtp.cfg
    cmd = [AI_ENGINE_PATH, "gtp", "-model", MODEL_PATH, "-config", CONFIG_PATH]
    print(f"Executing: {' '.join(cmd)}")
    
    try:
        # Create subprocess
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, # Capture stderr
            text=True,
            bufsize=1,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        print("AI Engine Process Started!")

        # Spawn a thread to print stderr (for debugging)
        import threading
        def print_stderr():
            for line in process.stderr:
                print(f"KATAGO ERR: {line.strip()}")
        threading.Thread(target=print_stderr, daemon=True).start()

    except Exception as e:
        print(f"Failed to launch AI engine: {e}")
        return

    async def handle_client(websocket):
        print("Client Connected")
        try:
            async for message in websocket:
                data = json.loads(message)
                command = data.get('command')
                args = data.get('args', [])
                
                print(f"Received: {command} {args}")

                # Modified to handle custom analysis command
                if command == 'analyze':
                    # Send kata-analyze
                    # Format: kata-analyze <color> <visits>
                    # Example: kata-analyze B 50
                    player_color = args[0]
                    visits = args[1] if len(args) > 1 else 50
                    gtp_cmd = f"kata-analyze {player_color} {visits}\n"
                    process.stdin.write(gtp_cmd)
                    process.stdin.flush()
                    
                    # Read analysis lines until empty line
                    # Each line starts with "info"
                    analysis_result = []
                    while True:
                        line = process.stdout.readline()
                        if line.strip() == "":
                            break
                        analysis_result.append(line.strip())
                    
                    # Join lines and send back
                    full_response = "\n".join(analysis_result)
                    
                    # Minimal parsing to find best move and winrate
                    # Format: info move <COORD> visits <N> winrate <W> ...
                    # We send raw for now, frontend parses it.
                    response_data = {
                        'id': data.get('id'),
                        'command': 'analyze',
                        'success': True,
                        'response': full_response
                    }
                    await websocket.send(json.dumps(response_data))
                    continue # Skip default flow

                # Construct GTP Command
                gtp_cmd = f"{command} {' '.join(map(str, args))}\n"
                
                if process.poll() is not None:
                    print("AI Engine has died!")
                    await websocket.send(json.dumps({'error': 'AI Engine not running'}))
                    break

                process.stdin.write(gtp_cmd)
                process.stdin.flush()

                # Read Response (Standard GTP)
                response_lines = []
                while True:
                    line = process.stdout.readline()
                    if line.strip() == "":
                        break 
                    response_lines.append(line.strip())
                
                full_response = "\n".join(response_lines)
                is_success = full_response.startswith('=')
                payload = full_response[1:].strip() if len(full_response) > 1 else ""

                response_data = {
                    'id': data.get('id'),
                    'command': command,
                    'success': is_success,
                    'response': payload
                }
                
                await websocket.send(json.dumps(response_data))
                
        except websockets.exceptions.ConnectionClosed:
            print("Client Disconnected")
        except Exception as e:
            print(f"Error handling client: {e}")

    async with websockets.serve(handle_client, "0.0.0.0", 3001):
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    try:
        asyncio.run(run_ai_bridge())
    except KeyboardInterrupt:
        print("Bridge Stopped")
