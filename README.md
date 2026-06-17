# rePW

A powerful Chrome extension designed to improve your experience on Physics Wallah (`pw.live`). It adds several highly requested features to help you study more efficiently and track your progress.

## Features

- ⏱ **TrueTime UI**: Automatically calculates and displays the exact time remaining on videos based on your current playback speed. Know exactly when your lecture will finish!
- 📊 **Study Time Tracker & Analysis**: Tracks your daily study time on the platform. Includes a detailed analysis page with charts to help you visualize your study habits over time.
- 🌙 **Smart Dark Mode**: Enables a comprehensive dark mode across the entire site to reduce eye strain during late-night study sessions.
- ⏩ **Custom Playback Speed**: Overrides the native video player's speed limits, allowing you to watch lectures at up to 4.00x speed.

## Installation

Since this extension is not currently available on the Chrome Web Store, you can install it manually in developer mode:

1. Download or clone this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/` in your address bar.
3. Enable **Developer mode** using the toggle switch in the top right corner.
4. Click the **Load unpacked** button in the top left corner.
5. Select the directory containing the extension files.
6. The extension is now installed! You can pin it to your toolbar for easy access to settings and your study time analysis.

## Usage

Click the extension icon in your Chrome toolbar to open the settings panel. From there you can:
- See your total study time for the day at a glance.
- Click **Detailed Analysis** to view your study time charts.
- Toggle the **TrueTime UI** and **Dark Mode** on or off.
- Select your preferred **Custom Speed** from the dropdown menu.

## Permissions

- `storage`: Required to save your extension settings and track your study time history.
- `activeTab` & `scripting`: Required to inject the Dark Mode, TrueTime UI, and custom speed controllers into the page.
- `downloads`: Used for exporting your data (if applicable).
