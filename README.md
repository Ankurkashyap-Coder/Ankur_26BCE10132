# Real-Time Live Polling & Quiz Application

A lightweight, production-ready full-stack live polling application built to fulfill the SDC recruitment technical challenge. This platform enables an administrator to create dynamic polls and broadcast live, synchronized voting metrics to connected participants in real time without page refreshes.

##  Tech Stack & Architecture
* **Frontend:** Semantic HTML5, Custom Responsive CSS3 Variables, Vanilla JavaScript (ES6+).
* **Backend:** Node.js, Express.js REST Framework.
* **Real-Time Layer:** WebSockets via Socket.io (Bidirectional Event-Driven Engine).
* **State Management:** In-Memory Server Cache (RAM storage for low-latency calculations).

---

## ⚡ Key Architectural Highlights

### 1. Event-Driven Real-Time Synchronization
Instead of utilizing standard HTTP polling—which repeatedly requests server updates and degrades performance—this application establishes a **persistent, bidirectional TCP handshake via WebSockets**. When an admin updates a room phase or a user casts a vote, data payloads are actively **pushed** by the server to targeted client socket rooms instantly.

### 2. Strict State-Machine Operations
* **Lobby Phase (`waiting`):** Clients are locked in a server-pushed waiting screen. They cannot fetch questions or submit answers prematurely.
* **Active Voting Phase (`voting`):** Upon the admin's trigger, the server broadcasts structural questions and changes states globally without client reloads.
* **Concluded Phase (`ended`):** Results freeze permanently, the winning selection is calculated and highlighted, and further incoming socket payloads for that room code are automatically rejected to preserve data integrity.

### 3. Double-Voting Mitigation
To defend against artificial vote inflation, the client frontend locks and disables interactive components immediately upon choice submission. Additionally, the backend updates individual socket states to ensure one submission per connection.

---

# ⚡ Real-Time Live Polling & Quiz Application

A production-ready full-stack live polling application built to fulfill the SDC recruitment technical challenge (Track 1). This platform enables an administrator to create dynamic polls and broadcast live, synchronized voting metrics to connected participants in real time without page refreshes.

## 🔗 Live Deployed Demo Links

Anyone can test the live application instantly using these public URLs:

*   ⚙️ **Admin Control Panel (Create Polls Here):** [https://onrender.com](https://onrender.com)
*   📱 **Participant Portal (Join & Vote Here):** [https://onrender.com](https://onrender.com)

---

## 🕹️ Step-by-Step Testing Guide

To see the real-time WebSocket connection in action on your computer:

1.  **Open the Admin Panel:** Click the Admin Link above to open the poll creation form.
2.  **Create a Poll:** Type a question (e.g., *“Favorite Language?”*) and enter at least two options, then click **Create Poll Room**.
3.  **Get Your 5-Digit Code:** The app will instantly display a unique **5-digit room code** (e.g., `X7K2B`) in a blue banner.
4.  **Join as a Participant:** Open a separate **Incognito Tab** or use your phone, open the Participant Portal link above, type in that 5-digit room code, and click **Join Room**.
5.  **Test Real-Time Sync:** Arrange both windows side-by-side. Click **Begin Voting** on the Admin tab, cast your vote on the participant tab, and watch the horizontal progress bars grow instantly in real time without refreshing!

---

## 🛠️ Tech Stack & Architecture

*   **Frontend:** Semantic HTML5, Custom Responsive CSS3 Grid/Variables, Vanilla JavaScript (ES6+).
*   **Backend Framework:** Node.js with Express.js REST routing engine.
*   **Real-Time Layer:** Persistent WebSockets via **Socket.io** (Bidirectional event-driven protocol).
*   **State Management:** High-speed In-Memory Server Cache (RAM object storage).

---

## 💻 Local Installation & Setup

If you want to download and run this project locally on your machine, follow these steps:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com
    cd Ankur_26BCE10132
    ```
2.  **Install Dependencies:**
    ```bash
    npm install
    ```
3.  **Launch the Local Server:**
    ```bash
    npm start
    ```
4.  **Access Locally:**
    *   Admin View: `http://localhost:3000/admin.html`
    *   Participant View: `http://localhost:3000`
