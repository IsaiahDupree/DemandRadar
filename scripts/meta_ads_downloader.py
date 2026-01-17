#!/usr/bin/env python3
"""
Meta Ads Library CSV Downloader
Automates Safari to download CSV exports from Facebook Ad Library.

Usage:
    python meta_ads_downloader.py "fitness" "weight loss" "supplements"
    python meta_ads_downloader.py --keywords-file keywords.txt
"""

import subprocess
import sys
import os
import time
import glob
from pathlib import Path
from datetime import datetime

# Download folder (macOS default)
DOWNLOADS_FOLDER = Path.home() / "Downloads"
OUTPUT_FOLDER = Path(__file__).parent.parent / "data" / "meta_ads"


def run_safari_automation(keywords: list[str]) -> bool:
    """Run the AppleScript to automate Safari downloads."""
    script_path = Path(__file__).parent / "meta_ads_safari_automation.scpt"
    
    if not script_path.exists():
        print(f"❌ AppleScript not found: {script_path}")
        return False
    
    cmd = ["osascript", str(script_path)] + keywords
    print(f"🚀 Starting Safari automation for {len(keywords)} keywords...")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        print(result.stdout)
        if result.stderr:
            print(f"⚠️  {result.stderr}")
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("❌ Safari automation timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


def find_new_csv_files(before_time: float) -> list[Path]:
    """Find CSV files downloaded after the given timestamp."""
    csv_files = []
    for f in DOWNLOADS_FOLDER.glob("*.csv"):
        if f.stat().st_mtime > before_time:
            csv_files.append(f)
    return csv_files


def move_and_rename_csvs(csv_files: list[Path], keywords: list[str]) -> list[Path]:
    """Move downloaded CSVs to output folder with better names."""
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    
    moved = []
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    for i, csv_file in enumerate(csv_files):
        keyword = keywords[i] if i < len(keywords) else f"unknown_{i}"
        safe_keyword = keyword.replace(" ", "_").replace("/", "-")
        new_name = f"meta_ads_{safe_keyword}_{timestamp}.csv"
        new_path = OUTPUT_FOLDER / new_name
        
        csv_file.rename(new_path)
        moved.append(new_path)
        print(f"✅ Saved: {new_path}")
    
    return moved


def download_via_selenium(keywords: list[str]) -> list[Path]:
    """Alternative: Use Selenium for more reliable automation."""
    try:
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.safari.options import Options
    except ImportError:
        print("❌ Selenium not installed. Install with: pip install selenium")
        return []
    
    options = Options()
    driver = webdriver.Safari(options=options)
    downloaded = []
    
    try:
        for keyword in keywords:
            encoded = keyword.replace(" ", "%20")
            url = f"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&media_type=all&search_type=keyword_unordered&q={encoded}"
            
            print(f"📥 Loading: {keyword}")
            driver.get(url)
            time.sleep(5)  # Wait for dynamic content
            
            # Try to find and click download button
            try:
                download_btn = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Download') or contains(@aria-label, 'Download')]"))
                )
                download_btn.click()
                print(f"✅ Clicked download for: {keyword}")
                time.sleep(3)
            except Exception as e:
                print(f"⚠️  Could not find download button for {keyword}: {e}")
        
    finally:
        driver.quit()
    
    return downloaded


def main():
    keywords = []
    
    # Parse arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--keywords-file":
            if len(sys.argv) > 2:
                with open(sys.argv[2]) as f:
                    keywords = [line.strip() for line in f if line.strip()]
            else:
                print("❌ Please provide keywords file path")
                sys.exit(1)
        elif sys.argv[1] == "--selenium":
            # Use Selenium instead of AppleScript
            keywords = sys.argv[2:] if len(sys.argv) > 2 else ["fitness"]
            download_via_selenium(keywords)
            return
        else:
            keywords = sys.argv[1:]
    else:
        # Default keywords
        keywords = ["fitness", "weight loss", "supplements"]
    
    print(f"""
╔══════════════════════════════════════════════════════════╗
║  Meta Ads Library CSV Downloader                         ║
║  Keywords: {', '.join(keywords[:3])}{'...' if len(keywords) > 3 else ''}
╚══════════════════════════════════════════════════════════╝
""")
    
    # Record time before download
    before_time = time.time()
    
    # Run automation
    success = run_safari_automation(keywords)
    
    if success:
        # Wait a moment for downloads to complete
        time.sleep(2)
        
        # Find and move new CSVs
        new_csvs = find_new_csv_files(before_time)
        if new_csvs:
            moved = move_and_rename_csvs(new_csvs, keywords)
            print(f"\n✅ Downloaded {len(moved)} CSV files to {OUTPUT_FOLDER}")
        else:
            print("\n⚠️  No new CSV files found. Manual download may be required.")
            print("   The Ad Library may require manual interaction for CSV export.")
    else:
        print("\n❌ Automation failed. Try manual download or use --selenium flag.")


if __name__ == "__main__":
    main()
