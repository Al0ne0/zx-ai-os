import os
import subprocess
import sys
import shutil

def main():
    print("Zx-Music Downloader")
    print("-------------------")

    # Check if spotdl is installed
    if not shutil.which("spotdl"):
        print("❌ Error: 'spotdl' is not found in your PATH.")
        print("Please install it using: pip install spotdl")
        input("\nPress Enter to exit...")
        sys.exit(1)

    while True:
        playlist_url = input("\nEnter the Spotify playlist URL: ").strip()
        if playlist_url:
            break
        print("❌ Playlist URL cannot be empty. Please try again.")

    # Use a specific folder for downloads
    output_folder = os.path.join(os.path.expanduser("~"), "Music", "ZxMusicDownloads")
    os.makedirs(output_folder, exist_ok=True)
    
    print(f"\n⬇️  Downloading to: {output_folder}")
    print("Please wait...")

    try:
        # Run spotdl
        subprocess.run(
            ["spotdl", playlist_url, "--output", output_folder],
            check=True
        )
        print("\n✅ Download completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"\n❌ An error occurred during download (Exit code: {e.returncode})")
    except FileNotFoundError:
        print("\n❌ Error: Could not execute spotdl command.")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
