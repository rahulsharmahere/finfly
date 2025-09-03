\# 📱 FinFly – Firefly III Mobile Client

FinFly is a modern \*\*React Native mobile application\*\* for \[Firefly III\](https://www.firefly-iii.org/), the self-hosted personal finance manager.

It brings your Firefly III finances to your Android/iOS device with a clean, widget-style dashboard, charts, and fast transaction entry.

\---

\## ✨ Features

\- 🔑 Secure login with \*\*Personal Access Token (PAT)\*\* + encrypted storage

\- 📊 Dashboard with:

\- Debit vs Credit bar chart

\- Category-wise expenses (pie chart)

\- Income vs Expense over time (line chart)

\- Net Worth, Budgets, Account Balances, and Upcoming Bills widgets

\- 📜 Latest transactions list (last 10)

\- 📅 Date filters (1d, 30d, 90d, YTD, Custom) with custom range picker

\- 🎨 Light/Dark theme toggle

\- ➕ Animated Floating Action Button (FAB) to quickly add \*\*Withdraw, Deposit, Transfer\*\*

\- 📂 Reusable card-based UI components

\- 🔐 Credentials stored securely with EncryptedStorage

\- 🌐 Works with any Firefly III instance (self-hosted or remote)

\---

\## 🚀 Getting Started

\### 1. Clone the repository

\`\`\`bash

git clone https://github.com/yourusername/finfly.git

cd finfly

2\. Install dependencies

npm install --legacy-peer-deps

3\. Configure Firefly III

Open the app and enter your Firefly III host URL and Personal Access Token (PAT).

These will be securely saved for auto-login.

📱 Running the App

On Android (Windows / Linux / Mac)

Start Metro bundler:

npx react-native start

In another terminal, run the Android build:

npx react-native run-android

The app should open automatically on your Android emulator or connected device.

⚠️ Note: I develop on Windows so only the Android build is tested and generated here.

On iOS (Mac only)

Since I don’t have a Mac, I cannot generate the iOS build myself.

If you are on macOS, you can build it by following these steps:

Install Xcode

.

Install pods:

cd ios

pod install

cd ..

Run on iOS simulator:

npx react-native run-ios

To generate an iOS archive:

Open ios/FinFly.xcworkspace in Xcode

Select your target device

Go to Product > Archive

Export the .ipa file for distribution

📸 Screenshots

(coming soon – add screenshots of your dashboard, charts, FAB, etc.)

🛠️ Tech Stack

React Native

Firefly III API

Axios

React Navigation

Recharts / react-native-svg-charts

EncryptedStorage

🤝 Contributing

Contributions are welcome!

Fork the repo

Create a feature branch

Submit a pull request

📜 License

This project is licensed under the MIT License.

See LICENSE

for details.

🙌 Credits

Firefly III

– the amazing self-hosted finance manager

Community libraries that made this possible

\---

Would you like me to also include a \*\*badges section\*\* (like build status, version, platform: Android/iOS, etc.) at the top to make it look even more professional on GitHub?