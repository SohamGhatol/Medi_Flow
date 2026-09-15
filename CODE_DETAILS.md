# 📋 Medi-Flow Systems - Codebase Architecture & Code Details

This document provides a comprehensive technical breakdown of all the code stored in the **Medi-Flow Systems** project, detailing its architecture, file structure, technologies, database models, backend APIs, frontend components, and AI subsystems.

---

## 🏗️ 1. High-Level Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | Python 3.10+, Flask 2.3.2 | Core REST API backend and routing |
| **Database & ORM** | PostgreSQL, Flask-SQLAlchemy 3.0.5, psycopg2-binary | Relational database storage, schema management, and ORM |
| **Authentication** | PyJWT (JSON Web Tokens), bcrypt, Werkzeug security | Dual authentication (Role-Based for Staff, Token-Based for Customers) |
| **NLP & AI Engine** | spaCy (`en_core_web_sm`), FuzzyWuzzy, scikit-learn, NLTK | Clinical drug entity extraction, fuzzy typo matching, intent classification |
| **Reporting & Export** | ReportLab, Pandas | Automated PDF receipt and sales report generation |
| **Frontend Framework** | React 18.2, React Router DOM v6 | Single Page Application (SPA) dual-portal user interface |
| **Styling** | Tailwind CSS 3.3.2, PostCSS, Autoprefixer | Utility-first responsive modern UI design |
| **Data Visualization** | Chart.js 4.3, react-chartjs-2 5.3 | Interactive analytics charts for sales and inventory |
| **HTTP Client** | Axios 1.4 | Asynchronous communication with Flask backend |

---

## 📂 2. Directory Tree & Code Organization

```
MEdi FLow/
├── backend/                        # Python / Flask Application
│   ├── app.py                      # Flask Application Factory & Server entry point
│   ├── config.py                   # Configuration class (DB URI, JWT keys, Uploads)
│   ├── init_db.py                  # Database initial seeding (Roles, Admin, Companies)
│   ├── create_database.py          # PostgreSQL database creation script
│   ├── migrate_database.py         # Schema migration script for customer/e-commerce
│   ├── add_sample_medicines.py     # Seeds sample OTC and Rx medicines
│   ├── check_dependencies.py       # Dependency verification utility
│   ├── update_medicines.py         # Utility to patch drug attributes
│   ├── drugs.json                  # Clinical drug knowledge dataset (24+ medications)
│   ├── requirements.txt            # Production Python package requirements
│   ├── requirements_simple.txt     # Flexible version package requirements
│   │
│   ├── models/                     # SQLAlchemy Database Models
│   │   ├── __init__.py             # Database instance initialization (`db = SQLAlchemy()`)
│   │   ├── user.py                 # `User` and `Role` models
│   │   ├── medicine.py             # `Medicine` and `Company` models
│   │   ├── sale.py                 # `Sale` and `SaleItem` models
│   │   ├── purchase.py             # `Purchase` and `PurchaseItem` models
│   │   ├── customer.py             # `Customer` and `CartItem` models
│   │   ├── order.py                # `Order`, `OrderItem`, and `OrderStatusHistory` models
│   │   └── chatbot_kb.py           # `ChatbotKB` (JSONB) and `ChatbotLog` models
│   │
│   ├── routes/                     # Modular Flask Blueprints (REST API)
│   │   ├── auth_routes.py          # Staff authentication (/api/auth/login, /api/auth/verify)
│   │   ├── medicine_routes.py      # Inventory CRUD, low stock alerts, search (/api/medicines)
│   │   ├── sales_routes.py         # In-store counter POS checkout (/api/sales)
│   │   ├── purchase_routes.py      # Supplier stock procurement (/api/purchase)
│   │   ├── report_routes.py        # Sales analytics & PDF report generator (/api/reports)
│   │   ├── admin_routes.py         # User management, audit logs, system stats (/api/admin)
│   │   ├── staff_order_routes.py   # Staff prescription review & order approval (/api/staff)
│   │   ├── customer_auth_routes.py # Customer sign-up, login, password reset (/api/customer)
│   │   ├── customer_product_routes.py # E-commerce catalog, search, OTC/Rx filter (/api/shop)
│   │   ├── customer_cart_routes.py # Shopping cart operations (/api/customer/cart)
│   │   ├── customer_order_routes.py# Customer checkout & prescription upload (/api/customer/orders)
│   │   ├── chatbot_routes.py       # Rule-based chatbot fallback endpoints (/api/chat/old)
│   │   ├── chatbot_routes_v2.py    # Primary API-first chatbot endpoints (/api/chat)
│   │   └── chatbot_training_routes.py # Chatbot user feedback & active learning (/api/chat/training)
│   │
│   ├── chatbot/                    # Intelligent Medical Assistant Core
│   │   ├── nlp_engine.py           # spaCy entity recognition & Fuzzy matching
│   │   ├── chatbot_tools.py        # Medication queries, dosage, side-effects, interactions
│   │   ├── chatbot_engine_v2.py    # Conversation state, intent router, tool executor
│   │   ├── inference_engine.py     # Fallback medical reasoning engine
│   │   ├── training_system.py      # Retraining pipelines from user feedback
│   │   └── loader.py               # Loads `drugs.json` into PostgreSQL `chatbot_kb`
│   │
│   └── uploads/                    # User file storage
│       └── prescriptions/          # Uploaded prescription receipts (JPG/PNG/PDF)
│
├── frontend/                       # React Single Page Application
│   ├── package.json                # NPM packages & build scripts
│   ├── tailwind.config.js          # Tailwind CSS theme configuration
│   ├── postcss.config.js           # PostCSS plugins config
│   │
│   └── src/
│       ├── index.js                # React DOM root render
│       ├── index.css               # Global CSS & Tailwind directives
│       ├── App.js                  # React Router root definitions
│       │
│       ├── context/
│       │   └── AuthContext.js      # React Context for staff authentication & session state
│       │
│       ├── services/
│       │   ├── api.js              # Axios instance for staff APIs with JWT interceptor
│       │   ├── customerApi.js      # Axios instance for customer e-commerce APIs
│       │   ├── auth.js             # Staff authentication helper functions
│       │   └── chat.js             # Chatbot API integration helpers
│       │
│       └── components/             # UI Views & Interactive Components
│           │   # Staff & Admin Portal Components:
│           ├── DualLoginPage.jsx   # Portal selector (Staff vs Customer login)
│           ├── LoginForm.jsx       # Staff login screen
│           ├── Dashboard.jsx       # Real-time metrics, revenue, low stock & expiry alerts
│           ├── MedicineTable.jsx   # Paginated medicine inventory table with filters
│           ├── AddMedicine.jsx     # Form to register new drugs (batch, expiry, price, Rx/OTC)
│           ├── EditMedicine.jsx    # Form to update drug details and stock
│           ├── SalesForm.jsx       # Point-of-Sale (POS) counter billing interface
│           ├── Reports.jsx         # Sales trends, revenue charts, and PDF download triggers
│           ├── AdminPanel.jsx      # Admin panel for user management and audit logging
│           ├── OnlineOrders.jsx    # Staff order processing & prescription review screen
│           │
│           │   # Customer E-Commerce Portal Components:
│           ├── CustomerLogin.jsx   # Customer account login view
│           ├── CustomerRegister.jsx# Customer account registration view
│           ├── ProductCatalog.jsx  # Online pharmacy catalog with OTC/Rx badges & search
│           ├── ShoppingCart.jsx    # Shopping cart with prescription warning alerts
│           ├── Checkout.jsx        # Multi-step checkout with prescription file uploader
│           ├── OrderConfirmation.jsx # Post-checkout success and order summary view
│           ├── CustomerDashboard.jsx # Customer order history and status overview
│           ├── OrderTracking.jsx   # Step-by-step progress tracking for placed orders
│           │
│           │   # Shared AI Components:
│           ├── ChatWidget.jsx      # Legacy chatbot floating widget
│           └── ChatWidgetV2.jsx    # Advanced floating chatbot with suggestions & context
│
└── docs/                           # Documentation and guides
```

---

## 🗄️ 3. Database Schema & Data Models

### 1. User & Access Control (`models/user.py`)
- **`Role`**:
  - `role_id` (PK, Integer)
  - `role_name` (String: `Admin`, `Manager`, `Staff`)
- **`User`**:
  - `user_id` (PK, Integer)
  - `username` (String, unique)
  - `password_hash` (String, bcrypt hashed)
  - `role_id` (FK -> `roles.role_id`)
  - `created_at` (DateTime)

### 2. Pharmacy Inventory (`models/medicine.py`)
- **`Company`**: Manufacturer info (`name`, `contact`, `address`).
- **`Medicine`**:
  - `medicine_id` (PK, Integer)
  - `name` (String, e.g., "Paracetamol 500mg")
  - `generic_name` (String, e.g., "Acetaminophen")
  - `category` (String, e.g., "Analgesic")
  - `company_id` (FK -> `companies.company_id`)
  - `batch_no`, `expiry_date`, `manufacture_date`
  - `quantity` (Current inventory in stock)
  - `unit_price`, `selling_price`
  - `product_type` (`OTC` for Over-The-Counter, `Rx` for Prescription Required)
  - `description`, `image_url`

### 3. Point-of-Sale (POS) & Procurement (`models/sale.py`, `models/purchase.py`)
- **`Sale` & `SaleItem`**: In-store retail transactions, total amount, customer name, date, cashier user ID.
- **`Purchase` & `PurchaseItem`**: Wholesale purchases from pharmaceutical distributors to restock inventory.

### 4. E-Commerce & Customer Orders (`models/customer.py`, `models/order.py`)
- **`Customer`**:
  - `customer_id` (PK, Integer)
  - `name`, `email` (unique), `phone`
  - `password_hash` (Werkzeug hashed)
  - `address`, `city`, `state`, `pincode`
- **`CartItem`**:
  - `cart_item_id` (PK, Integer)
  - `customer_id` (FK -> `customers.customer_id`)
  - `medicine_id` (FK -> `medicines.medicine_id`)
  - `quantity`
- **`Order`**:
  - `order_id` (PK, Integer), `order_number` (Unique tracking string)
  - `customer_id` (FK -> `customers.customer_id`)
  - `total_amount`, `shipping_address`, `contact_phone`
  - `requires_prescription` (Boolean)
  - `prescription_url` (Path to uploaded file in `uploads/prescriptions/`)
  - `prescription_status` (`Pending`, `Approved`, `Rejected`)
  - `status` (`Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`)
- **`OrderItem`**: Quantity, unit price, and subtotal per medicine ordered.
- **`OrderStatusHistory`**: Complete audit trail of order stage changes with timestamps and notes.

### 5. AI Knowledge Base & Logs (`models/chatbot_kb.py`)
- **`ChatbotKB`**:
  - `drug_id` (Text, unique identifier)
  - `name` (Text, drug name)
  - `data` (PostgreSQL `JSONB` structure storing dosage, indications, contraindications, side effects, precautions, interactions)
- **`ChatbotLog`**:
  - `query_text`, `intent`, `entities` (JSONB), `response_text`, `flagged`, `timestamp`

---

## ⚡ 4. Backend REST API Architecture

### Staff Portal Endpoints
- **`/api/auth`**: Staff credentials validation and JWT token issuance.
- **`/api/medicines`**: Inventory listing with search, low-stock threshold queries, addition, editing, and deletion.
- **`/api/sales`**: Process in-store sales transactions, generate sales receipts, deduct inventory levels automatically.
- **`/api/purchase`**: Record wholesale restock batches from suppliers.
- **`/api/reports`**: Generate daily/weekly/monthly revenue reports, profit margins, and PDF files.
- **`/api/admin`**: Add/edit staff accounts, assign roles, view audit activity logs.
- **`/api/staff/orders`**: View online customer orders, preview uploaded prescription files, approve or reject prescriptions, update shipping stages.

### Customer Portal Endpoints
- **`/api/customer/register` & `/api/customer/login`**: Customer signup, login, JWT token issuance.
- **`/api/shop/products`**: Product search, category filters, OTC vs. Rx separation, stock availability checks.
- **`/api/customer/cart`**: Get cart contents, add items, update quantities, remove items, clear cart.
- **`/api/customer/orders/place`**: Multi-part form endpoint accepting JSON order data and prescription file uploads.
- **`/api/customer/orders/:id/track`**: Real-time status lookup and timeline for customer deliveries.

### AI & Chatbot Endpoints
- **`/api/chat/query`**: Processes natural language medical queries, extracts drug entities, returns clinical guidance.
- **`/api/chat/feedback`**: Records user accuracy feedback (ratings, corrections) into `chatbot_logs`.
- **`/api/chat/training/retrain`**: Triggers intent classification model updates based on logged user queries.

---

## 🧠 5. AI Chatbot Engine Breakdown

The project integrates an intelligent medical assistant capable of answering user queries about medicines:

1. **Entity Extraction (`chatbot/nlp_engine.py`)**:
   - Uses spaCy's English pipeline (`en_core_web_sm`) to tokenize and extract noun chunks.
   - Utilizes `FuzzyWuzzy` (Levenshtein distance) to match misspellings (e.g., `"paracetmol"` -> `"Paracetamol"`).
2. **Intent Classification**:
   - Detects user intent such as:
     - `dosage` (e.g., "What is the dose for Ibuprofen?")
     - `side_effects` (e.g., "What are the side effects of Aspirin?")
     - `uses` (e.g., "What is Omeprazole used for?")
     - `alternatives` (e.g., "What can I take instead of Cetirizine?")
     - `interactions` (e.g., "Can I take Aspirin with Warfarin?")
3. **Knowledge Retrieval (`chatbot/chatbot_tools.py`)**:
   - Queries PostgreSQL `chatbot_kb` table where clinical data for 24+ common drugs is stored as structured JSON.
4. **Context Awareness & Fallback**:
   - Maintains previous conversation context so users can ask follow-up questions without repeating the drug name.
   - Has a rule-based inference fallback engine (`inference_engine.py`) if NLP matching confidence is low.

---

## 💻 6. Frontend Architecture & Routing

The React frontend operates as a unified dual-portal application managed via `react-router-dom`:

### Route Map (`frontend/src/App.js`):
| Route | Component | Access Type | Description |
| :--- | :--- | :--- | :--- |
| `/` | `DualLoginPage` | Public | Entry portal to select Staff Login or Customer Store |
| `/login` | `LoginForm` | Public | Staff & Admin login screen |
| `/dashboard` | `Dashboard` | Staff | Pharmacy operations dashboard with metric cards |
| `/medicines` | `MedicineTable` | Staff | Medicine stock management table |
| `/medicines/add` | `AddMedicine` | Staff | Form to add new medicine batches |
| `/medicines/edit/:id` | `EditMedicine` | Staff | Edit medicine details |
| `/sales` | `SalesForm` | Staff | In-store POS billing counter |
| `/reports` | `Reports` | Staff | Visual financial & inventory reporting |
| `/admin` | `AdminPanel` | Admin | Staff user management & audit logs |
| `/online-orders` | `OnlineOrders` | Staff | Verify customer prescriptions & process orders |
| `/customer/login` | `CustomerLogin` | Customer | Customer account login |
| `/customer/register` | `CustomerRegister`| Customer | Customer account registration |
| `/shop` | `ProductCatalog` | Customer | Online medicine shop with OTC/Rx filtering |
| `/cart` | `ShoppingCart` | Customer | Shopping cart with prescription alerts |
| `/checkout` | `Checkout` | Customer | Address entry & prescription file upload |
| `/order-confirmation` | `OrderConfirmation`| Customer | Order placed confirmation screen |
| `/customer/orders` | `CustomerDashboard` | Customer | Order history list |
| `/customer/orders/:id/track` | `OrderTracking` | Customer | Live timeline of order fulfillment |

---

## 🔒 7. Security & Authentication Implementation

- **Staff Authentication**:
  - Passwords hashed using `bcrypt`.
  - On successful login, the server issues a JWT token containing `user_id`, `username`, and `role`.
  - Staff Axios client (`services/api.js`) automatically attaches `Authorization: Bearer <token>` to requests.
- **Customer Authentication**:
  - Independent customer credentials managed in `customers` table with `werkzeug.security`.
  - Customer Axios client (`services/customerApi.js`) manages `customerToken` in `localStorage`.
- **Prescription Enforcement**:
  - If a cart contains any item marked `product_type === 'Rx'`, the checkout flow halts until a valid prescription image/document is uploaded.
  - Uploaded files are validated on the backend and saved with secure filenames in `backend/uploads/prescriptions/`.
  - Orders with prescription items are locked in `Pending` status until a staff member reviews and approves them from `/online-orders`.

---

## 📊 8. Summary of File Lines & Code Footprint

| Category | Files | Primary Language | Description |
| :--- | :--- | :--- | :--- |
| **Backend Models** | 8 files | Python | Database schema definitions & ORM relationships |
| **Backend Routes** | 13 files | Python | REST API endpoints for staff, customers, orders, reports |
| **AI / Chatbot** | 6 files | Python | NLP entity extractor, intent matching, knowledge loader |
| **Database Scripts** | 5 files | Python | Database setup, schema migrations, sample data seeding |
| **Frontend Components**| 20 components | JSX / React | UI views for staff management, shop, cart, checkout, chat |
| **Frontend Services** | 4 files | JavaScript | API abstraction layers and Axios interceptors |
| **Styling & Config** | 4 files | CSS / JS / JSON | Tailwind CSS theme, package configuration |

---
*Created for Medi-Flow Systems Codebase Reference.*
