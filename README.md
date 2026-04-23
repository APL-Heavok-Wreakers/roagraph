## 🏏 RoarGraph — Real-Time Cricket Emotion Intelligence

> *When the crowd roars, we graph it.*

RoarGraph is a **real-time AI-powered analytics platform** that transforms live cricket conversations into **emotion insights, momentum signals, and match intelligence**.

It processes high-volume fan data from platforms like Twitter/X, YouTube Live Chat, and WhatsApp to detect **how the crowd feels — moment by moment**.

---

## 🚀 Why This Matters

* 📊 Cricket isn’t just stats — it’s **emotion + momentum**
* 🔥 Crowd reactions often predict **turning points**
* 🧠 RoarGraph converts chaos into **structured intelligence**

---

## ✨ Features

* 📡 **Real-Time Data Ingestion**

  * Multi-source streaming (Twitter, YouTube, WhatsApp)

* 🧠 **AI Emotion Detection**

  * Handles Hinglish, slang, sarcasm
  * Multi-layer classification pipeline

* 📈 **Momentum & Spike Detection**

  * Detects viral match moments instantly
  * Z-score based anomaly detection

* 🌍 **City-wise Emotion Mapping**

  * Understand regional fan sentiment

* ⚡ **Live APIs + WebSockets**

  * Real-time dashboards
  * Event streaming (SPIKE_ALERT, MOMENT_CARD, etc.)

---

## 🧱 System Architecture (High-Level)

```text
Data Sources → Streaming (Pub/Sub) → AI Processing → Analytics → APIs/WebSockets
```

<details>
<summary>🔍 View Detailed Architecture</summary>

(keep your full architecture block here)

</details>

---

## 🛠️ Tech Stack

* **Cloud:** Google Cloud Platform (Pub/Sub, Cloud Run, BigQuery)
* **Backend:** Python / FastAPI
* **Streaming:** Pub/Sub
* **AI/NLP:** Gemini + Cloud NLP API
* **Infra:** Terraform
* **Testing:** k6

---

## 📂 Project Structure

```bash
RoarGraph/
├── terraform/
├── services/
├── bigquery/
├── openapi/
├── load-tests/
└── monitoring/
```

---

## 📊 Example Output (Add Screenshots Here)

👉 You should add:

* Emotion graph 📈
* Spike alert ⚡
* Dashboard UI 🖥️

---

## ⚙️ Quick Start

```bash
git clone https://github.com/APL-Heavok-Wreakers/roagraph.git
cd roagraph
```

### Deploy Infra

```bash
cd terraform
terraform init
terraform apply
```

---

## 📡 API Endpoints

* `/live-emotions`
* `/over-summary`
* `/moment-cards`
* `/city-split`
* `/ws/{match_id}` (WebSocket)

---

## 🧪 Use Cases

* 📺 Live match dashboards
* 🎯 Fantasy cricket decision support
* 📊 Broadcast analytics
* 🧠 Fan engagement platforms

---

## ⚡ Key Engineering Highlights

* Handles **massive real-time spikes (10x traffic)**
* Smart **multi-layer AI pipeline (cost optimized)**
* **Bot detection via cross-platform validation**
* **Auto-scaling architecture**

---

## 🔮 Future Improvements

* Live IPL API integration
* Predictive win probability
* Mobile dashboard
* Advanced ML models

---

## 👥 Team

**APL Heavok Wreakers**

---

## 🏆 Built For

* Hackathons
* System Design Showcases
* AI + Data Engineering Projects

---

## 📜 License

MIT License

---



Just tell me 👍
