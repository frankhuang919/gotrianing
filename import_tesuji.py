
import os
import json
import glob

# Configuration
SOURCE_ROOT = r"E:\weiqi\wildfox\curcia\《李昌镐精讲围棋手筋》李昌镐"
OUTPUT_FILE = r"public/tesuji_data.json"

def parse_sgf_content(content):
    # Simple cleanup if needed
    return content

def scan_directory(root_path):
    volumes = []
    
    # Get Volumes (Level 1)
    vol_dirs = sorted([d for d in os.listdir(root_path) if os.path.isdir(os.path.join(root_path, d))])
    
    for vol_name in vol_dirs:
        vol_path = os.path.join(root_path, vol_name)
        chapters = []
        
        # Get Chapters (Level 2)
        chap_dirs = sorted([d for d in os.listdir(vol_path) if os.path.isdir(os.path.join(vol_path, d))])
        
        for chap_name in chap_dirs:
            chap_path = os.path.join(vol_path, chap_name)
            problems = []
            
            # Get SGF Files (Level 3)
            sgf_files = sorted(glob.glob(os.path.join(chap_path, "*.sgf")))
            
            for sgf_file in sgf_files:
                try:
                    with open(sgf_file, 'rb') as f:
                        raw = f.read()
                        # Try commonly used encodings for Chinese SGFs
                        try:
                            content = raw.decode('gbk')
                        except:
                            try:
                                content = raw.decode('utf-8')
                            except:
                                content = raw.decode('gb18030', errors='ignore')

                    file_name = os.path.basename(sgf_file)
                    problems.append({
                        "id": file_name,
                        "title": file_name.replace(".sgf", ""),
                        "sgf": content
                    })
                except Exception as e:
                    print(f"Error reading {sgf_file}: {e}")
            
            if problems:
                chapters.append({
                    "title": chap_name,
                    "problems": problems
                })
        
        if chapters:
            volumes.append({
                "title": vol_name,
                "chapters": chapters
            })
            
    return volumes

if __name__ == "__main__":
    print(f"Scanning {SOURCE_ROOT}...")
    data = scan_directory(SOURCE_ROOT)
    
    # Ensure public dir exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully imported {len(data)} volumes into {OUTPUT_FILE}")
