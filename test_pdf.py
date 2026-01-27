import sys
import os

try:
    from pypdf import PdfReader
except ImportError:
    print("Error: pypdf not installed")
    sys.exit(1)

target_file = r"E:\weiqi\李昌镐21世纪围棋专题讲座 _ 实战定式 -- (韩)李昌镐著 ; 黄焰译; 李昌镐; 黄焰 -- Di 1 ban, Qing dao, 2011 -- 青岛_青岛出版社 -- 9787543671560 -- 7d25b1b8f887105f731cc5d5ac0117d9 -- Anna’s Archive.pdf"

if not os.path.exists(target_file):
    print(f"Error: File not found at {target_file}")
    # Try looking in the dir
    dirname = r"E:\weiqi"
    for f in os.listdir(dirname):
        if f.endswith(".pdf"):
            target_file = os.path.join(dirname, f)
            print(f"Found PDF: {target_file}")
            break

try:
    reader = PdfReader(target_file)
    print(f"Success: PDF Opened. Total Pages: {len(reader.pages)}")
    text = reader.pages[5].extract_text() # Try page 5 (skip cover)
    print("--- Content Sample ---")
    print(text[:500])
    print("----------------------")
except Exception as e:
    print(f"Error reading PDF: {e}")
