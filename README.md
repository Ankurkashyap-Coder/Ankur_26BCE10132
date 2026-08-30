# Real-Time Live Polling & Quiz Application

A lightweight, production-ready full-stack live polling application built to fulfill the SDC recruitment technical challenge. This platform enables an administrator to create dynamic polls and broadcast live, synchronized voting metrics to connected participants in real time without page refreshes.

## Ìª†Ô∏è Tech Stack & Architecture
* **Frontend:** Semantic HTML5, Custom Responsive CSS3 Variables, Vanilla JavaScript (ES6+).
* **Backend:** Node.js, Express.js REST Framework.
* **Real-Time Layer:** WebSockets via Socket.io (Bidirectional Event-Driven Engine).
* **State Management:** In-Memory Server Cache (RAM storage for low-latency calculations).

---

## ‚ö° Key Architectural Highlights

### 1. Event-Driven Real-Time Synchronization
Instead of utilizing standard HTTP polling‚Äîwhich repeatedly requests server updates and degrades performance‚Äîthis application establishes a **persistent, bidirectional TCP handshake via WebSockets**. When an admin updates a room phase or a user casts a vote, data payloads are actively **pushed** by the server to targeted client socket rooms instantly.

### 2. Strict State-Machine Operations
* **Lobby Phase (`waiting`):** Clients are locked in a server-pushed waiting screen. They cannot fetch questions or submit answers prematurely.
* **Active Voting Phase (`voting`):** Upon the admin's trigger, the server broadcasts structural questions and changes states globally without client reloads.
* **Concluded Phase (`ended`):** Results freeze permanently, the winning selection is calculated and highlighted, and further incoming socket payloads for that room code are automatically rejected to preserve data integrity.

### 3. Double-Voting Mitigation
To defend against artificial vote inflation, the client frontend locks and disables interactive components immediately upon choice submission. Additionally, the backend updates individual socket states to ensure one submission per connection.

---

## Ì≤ª Local Installation & Setup

Ensure you have **Node.js** installed on your system, then follow these instructions:

1. **Install Necessary Node Dependencies:**
   ```bash
   npm install
   ```

2. **Launch the Live Server Engine:**
   ```bash
   npm start
   ```

3. **Access the Interface:**
   * **Admin Console:** `http://localhost:3000/admin.html`
   * **Participant Portal:** `http://localhost:3000`
