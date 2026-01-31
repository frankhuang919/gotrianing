
import os
import json
import glob

# Configuration
SOURCE_ROOT = r"E:\weiqi\wildfox\liveAndDie"
OUTPUT_FILE = r"public/tsumego_data.json"

def scan_directory(root_path):
    volumes = []
    
    # Get Volumes (Level 1)
    # Get Volumes (Level 1)
    # E.g. "《围棋实用死活》"
    vol_dirs = sorted([d for d in os.listdir(root_path) if os.path.isdir(os.path.join(root_path, d))])
    
    # FILTER: strict user request
    ALLOWED = ["《李昌镐精讲围棋死活》", "《吴清源死活题》"]
    vol_dirs = [d for d in vol_dirs if any(allowed in d for allowed in ALLOWED)]
    
    for vol_name in vol_dirs:
        vol_path = os.path.join(root_path, vol_name)
        chapters = []
        
        # Check for Subdirectories (Chapters)
        chap_dirs = sorted([d for d in os.listdir(vol_path) if os.path.isdir(os.path.join(vol_path, d))])
        
        # If no chapters, treat the volume as containing problems directly
        if not chap_dirs:
            # Look for SGFs directly
            sgf_files = sorted(glob.glob(os.path.join(vol_path, "*.sgf")))
            if sgf_files:
                # Create a pseudo-chapter
                chapters.append({
                    "title": "全集", # "Complete Collection" or similar
                    "problems": parse_sgfs(sgf_files, category_name="全集")
                })
        else:
            # Has Chapters
            for chap_name in chap_dirs:
                chap_path = os.path.join(vol_path, chap_name)
                sgf_files = sorted(glob.glob(os.path.join(chap_path, "*.sgf")))
                if sgf_files:
                    # Rename numeric folders
                    if chap_name.isdigit():
                        chap_name = f"第 {chap_name} 章"
                        
                    chapters.append({
                        "title": chap_name,
                        "problems": parse_sgfs(sgf_files, category_name=chap_name)
                    })
        
        if chapters:
            # Clean Title: Remove "李昌镐" suffix carefully
            # The folder name is likely "《李昌镐精讲围棋死活》李昌镐"
            # We want to keep the one inside the brackets
            # Clean Title: Robust Fix
            # Remove trailing "李昌镐" (and spaces)
            import re
            clean_title = re.sub(r'\s*李昌镐\s*$', '', vol_name)
            
            # Explicit Override to ensure integrity and prevent over-cleaning
            if "李昌镐精讲围棋死活" in vol_name:
                 clean_title = "《李昌镐精讲围棋死活》"

            volumes.append({
                "title": clean_title,
                "chapters": chapters
            })
            
    return volumes

def parse_sgfs(file_list, category_name="Default"):
    problems = []
    import re
    import hashlib
    
    # Natural sort
    def natural_key(string):
        return [int(s) if s.isdigit() else s for s in re.split(r'(\d+)', string)]
    
    sorted_files = sorted(file_list, key=lambda x: natural_key(os.path.basename(x)))
    
    # Sort files
    sorted_files = sorted(file_list, key=lambda x: natural_key(os.path.basename(x)))
    
    # Pagination REMOVED for "Same chapter problems in 1 chapter"
    
    for i, sgf_file in enumerate(sorted_files):
        try:
            with open(sgf_file, 'rb') as f:
                raw = f.read()
                try:
                    content = raw.decode('gbk')
                except:
                    try:
                        content = raw.decode('utf-8')
                    except:
                        content = raw.decode('gb18030', errors='ignore')

            file_name = os.path.basename(sgf_file)
            
            # Use unmodified category name (No splitting)
            current_category = category_name

            problems.append({
                "id": file_name,
                "title": file_name.replace(".sgf", ""),
                "sgf": content,
                "category": current_category
            })
        except Exception as e:
            print(f"Error reading {sgf_file}: {e}")
    return problems

if __name__ == "__main__":
    print(f"Scanning {SOURCE_ROOT}...")
    if not os.path.exists(SOURCE_ROOT):
        print(f"Error: Path {SOURCE_ROOT} does not exist.")
    else:
        data = scan_directory(SOURCE_ROOT)
        
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully imported {len(data)} volumes into {OUTPUT_FILE}")
