
import os

target_path = r"E:\weiqi\wildfox\curcia\《李昌镐精讲围棋手筋》李昌镐\第3卷\第1章 棋子的联络\3-1-1.sgf"

try:
    with open(target_path, 'rb') as f:
        content = f.read()
        print(f"File size: {len(content)} bytes")
        try:
            print("--- Decoded (UTF-8) ---")
            print(content.decode('utf-8'))
        except:
            print("--- UTF-8 Failed ---")
        
        try:
            print("--- Decoded (GBK) ---")
            print(content.decode('gbk'))
        except:
            print("--- GBK Failed ---")
            
except Exception as e:
    print(f"Error: {e}")
