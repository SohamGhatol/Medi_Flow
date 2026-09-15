# 🏥 Medi-Flow Systems: Project Modules & Academic Mapping

![Medi-Flow Systems Workflow Architecture](/C:/Users/soham/.gemini/antigravity-ide/brain/95bfb16a-c835-4785-a65b-169eb33d4f7d/mediflow_workflow_1789406425598.jpg)

This document outlines the 10 core modules of the Medi-Flow Systems project. It serves as a guide for presentations and academic submissions, demonstrating how theoretical computer science concepts are applied to a real-world Medical Store Management System.

---

## 1. Dual-Portal Architecture & Authentication (Staff + E-commerce)
* **Function**: Provides separate, secure interfaces—an internal dashboard for pharmacy staff/admins and an e-commerce storefront for customers.
* **Subjects Mapped**: Software Engineering, Information Security
* **Concepts Used**: 
  * JSON Web Tokens (JWT) for stateless authentication
  * Role-Based Access Control (RBAC)
  * Single Page Application (SPA) state management and protected routing

## 2. Conversational AI Chatbot (Expert System)
* **Function**: An intelligent assistant that helps customers find medicines, suggests alternatives, checks order status, and answers medical FAQs natively within the app.
* **Subjects Mapped**: Artificial Intelligence (AI)
* **Concepts Used**: 
  * Natural Language Processing (NLP) heuristics
  * Intent Recognition and Pattern Matching
  * Rule-Based Expert Systems
  * Decision Trees for conversation flow

## 3. Database Management & Order Workflow
* **Function**: The backbone of the application, managing complex relationships between inventory, customer orders, staff sales, and prescriptions.
* **Subjects Mapped**: Database Management Systems (DBMS)
* **Concepts Used**: 
  * Relational Database Design (Entity-Relationship Modeling)
  * 3NF Normalization
  * Complex SQL Joins and Aggregations
  * ACID Properties for transaction integrity

## 4. Point of Sale (POS) & Billing System
* **Function**: Facilitates in-store checkout for walk-in customers, generating digital invoices and instantly syncing with central inventory.
* **Subjects Mapped**: Software Engineering, Accounting Information Systems
* **Concepts Used**: 
  * Transaction Processing Systems (TPS)
  * Real-time Concurrency Control (preventing overselling)
  * Programmatic Document Generation (PDF creation)

## 5. Prescription OCR → Automatic Medicine Extraction
* **Function**: Allows users to upload a photo of a doctor's prescription. The system scans the image, extracts the prescribed medicine names/dosages, and automatically populates the customer's shopping cart.
* **Subjects Mapped**: Artificial Intelligence, Digital Image Processing
* **Concepts Used**: 
  * Optical Character Recognition (OCR) (e.g., Tesseract)
  * Named Entity Recognition (NER) for extracting pharmaceutical terms
  * Fuzzy string matching against the database inventory

## 6. Automatic Stock Replenishment Prediction
* **Function**: Analyzes historical sales velocity to predict when a medicine will run out, automatically generating draft Purchase Orders for suppliers before stockouts occur.
* **Subjects Mapped**: Data Mining, Operations Research
* **Concepts Used**: 
  * Time-Series Forecasting
  * Moving Averages and Velocity Calculations
  * Reorder Point (ROP) and Economic Order Quantity (EOQ) algorithms

## 7. Medicine Expiry Prediction & FEFO System
* **Function**: Tracks individual medicine batches and their expiry dates. Automatically flags near-expiry medicines and forces the system to dispense older batches first to minimize waste.
* **Subjects Mapped**: Database Management Systems, Supply Chain Management
* **Concepts Used**: 
  * First-Expire-First-Out (FEFO) Inventory Queuing
  * Database Triggers / Scheduled background jobs
  * Date/Time Analytics

## 8. Family Medicine Management
* **Function**: Enables a single customer account to manage health profiles, upload prescriptions, and track recurring medicine orders for multiple dependent family members (e.g., children, elderly parents).
* **Subjects Mapped**: Database Management Systems, Software Engineering
* **Concepts Used**: 
  * Hierarchical Data Modeling (One-to-Many relationships)
  * Data Segregation and Privacy Controls
  * Cron Jobs for recurring scheduling

## 9. Medicine Demand Heatmap
* **Function**: Provides a visual analytics dashboard showing pharmacy staff exactly which days of the week and hours of the day experience peak demand for specific medicines.
* **Subjects Mapped**: Data Visualization, Business Intelligence
* **Concepts Used**: 
  * Multidimensional Data Aggregation (SQL `GROUP BY` time bins)
  * Statistical Analytics (Z-Score for demand spike detection)
  * Matrix / Grid Visualization mapping

## 10. Dead-Stock Detection
* **Function**: Scans the inventory database to identify medicines that have not sold over a specific period, alerting management to capital tied up in slow-moving or obsolete inventory.
* **Subjects Mapped**: Data Analytics, Financial Management
* **Concepts Used**: 
  * Inventory Turnover Ratio calculation
  * Threshold-based Alerting Systems

---

## ⚠️ Critical Risk Areas & Potential Challenges

The following table outlines the primary technical and operational risks associated with implementing these advanced modules, along with their mitigation strategies.

| Risk Area / Module | Potential Challenge | Mitigation Strategy |
| :--- | :--- | :--- |
| **Prescription OCR Engine** | Inaccurate extraction of medicine names or dosages due to poor handwriting, blurriness, or low-quality images. | Implement OCR confidence thresholds, require mandatory human-in-the-loop review by pharmacists, and use fuzzy matching against the known inventory database. |
| **Dual-Portal Concurrency** | Race conditions where an online customer and an in-store staff member attempt to purchase the final unit of a medicine simultaneously. | Enforce strict Database-level row locking and leverage ACID properties during checkout transactions to prevent stock overselling. |
| **AI Chatbot (Expert System)** | Providing incorrect medical advice, hallucinating drug interactions, or making unsafe recommendations. | Strictly confine the AI's responses to a predefined, medically-vetted JSON Knowledge Base and enforce disclaimers that the bot does not replace a doctor. |
| **Data Privacy & Security** | Potential exposure or breach of sensitive customer health profiles, order history, and uploaded prescriptions. | Implement robust stateless JWT authentication, Bcrypt password hashing, and strict Role-Based Access Control (RBAC) separating customers from staff. |
| **FEFO Inventory Management** | Staff physically picking a newer batch off the physical shelf despite the software strictly deducting from the oldest batch. | Design POS UI alerts that force staff to visually verify the `batch_no` during checkout, coupled with regular physical dead-stock auditing reports. |
| **Automatic Replenishment** | Generating excess purchase orders during anomalous demand spikes (e.g., a sudden seasonal flu outbreak). | Apply smoothing algorithms (moving averages) and cap automated orders at a maximum threshold, requiring managerial approval for large purchases. |
