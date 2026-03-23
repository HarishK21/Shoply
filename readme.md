<h1>Shoply E-Commerce Site</h1>

<img width="1902" height="996" alt="image" src="https://github.com/user-attachments/assets/25f2cf00-b488-40ad-ba96-966dd83d0c03" />

## 📜 Overview
Shoply is a community-driven MERN Stack e-commerce platform for buying and selling a large variety of items on the our market. Users can create/edit listings for products, buy products from listings, and view their order history. Admins can manage items and delete them if necessary. 
<br>
In the future, additional functionality could be added, for example, filtering items by type, a more robust implementation to manage account and listings, hashing passwords and payment information to store more securely, adding security questions and a captcha, and some payment integration with libraries like Stripe JS.


<hr>



## 🧑‍💻 Team Members
- Ninh Dang
- Ranbir Gill
- Harish Kiritharan
- Stephen Nguyen

## 📝 Features
- **User Authentication:** 
  - Register, log in, securely.
- **List an Item**:
  - Users can list an item on the store.
  - Users can modify their listings at any time
  - Provide a name, brief description, an image, and a price.
- **View Orders**:
  - Users can view their previous orders
- **Shopping Cart**:
  - Users can add items to their shopping carts and then check out.
  - Users can modify their shopping cart to their needs.
- **Admin Features**:
  - Admins can delete items from the market as they see fit.
- **Responsive Design**:
  - Works on various devices, ie. Phone, Laptop, Desktop, etc. 

## 🤖 Technologies Used
- **Frontend:** HTML, CSS, React
- **Backend:** Node.js, Express
- **Database:** MongoDB

## 🏗️ Setup

**Prerequisites:** Node.js, npm, MongoDB (running locally).

1. **Clone the repository**
   - HTTPS: `git clone https://github.com/HarishK21/E-CommercePlatform.git`
   - SSH: `git clone git@github.com:HarishK21/E-CommercePlatform.git`
2. **Start MongoDB** on your machine (if not already running).
3. **Backend**
   - `cd backend`
   - `npm install`
   - `node server.js` — API runs on **http://localhost:8080** (or `PORT` from `.env`).
4. **Frontend** (in a second terminal)
   - `cd frontend`
   - `npm install`
   - `npm run dev` — open the localhost URL shown in the terminal.
5. Sign in with a [seeded user](#-seeded-users) or create an account.

**Environment (optional):** In `backend`, create a `.env` file and set `PORT` if you need a different port.

**Version control:** The project uses meaningful, descriptive commit messages to track changes (e.g. feature additions, bug fixes, docs updates).

## 👤 Seeded Users
When the backend starts with an empty database, the following users are created automatically. You can sign in with any of these accounts:

| Name      | Email                     | Password     | Role  |
|-----------|---------------------------|--------------|-------|
| admin521  | admin521@gmail.com        | 521admin521  | admin |
| Gill123   | gill123@gmail.com         | S1234        | user  |
| test123   | test123@gmail.com         | test123      | user  |
| Admin     | admin@gmail.com           | admin123     | admin |
| Test      | unique_verify_2026@demo.com | password   | user  |

Use an **admin** account to access admin features (e.g. deleting items). Seeding only runs when there are no users in the database.

## 🛣️ Routes

All API routes are under the base URL **`/api`** (e.g. `http://localhost:8080/api`).

| Mount      | Purpose              |
|-----------|----------------------|
| `/api/items` | Item CRUD (store products) |
| `/api`       | Auth: register, login; Orders: create, list by user |

Health check: `GET /` returns `{ status: 'ok', message: 'Shoply API is running' }`.

## 📡 API Reference

**Base URL:** `http://localhost:8080/api` (or your `PORT`).  
Responses use JSON. Error responses include `{ success: false, message: "..." }` where applicable.

### Items (`/api/items`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/items` | List all items. **Query:** `minPrice`, `maxPrice`, `sort` (`price_asc`, `price_desc`, `newest`). |
| `GET` | `/api/items/:id` | Get one item by numeric `id`. 404 if not found. |
| `POST` | `/api/items` | Create item. **Body:** `name` (required), `price` (required), `description`, `postedBy`, `userId`, `hasImage`, `imageURL`. Returns 201 + created item. |
| `PUT` | `/api/items/:id` | Update item. **Body:** any of `name`, `description`, `postedBy`, `userId`, `price`, `hasImage`, `imageURL`. Returns 200 + updated item. |
| `DELETE` | `/api/items/:id` | Delete item by numeric `id`. Returns 204 on success, 404 if not found. |

### Auth (`/api`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/register` | Register. **Body:** `name`, `email`, `password` (all required). Returns 201 or 409 if email exists. |
| `POST` | `/api/login` | Login. **Body:** `email`, `password`. Returns 200 + `{ success, message, user: { id, name, email, role } }` or 401. |

### Orders (`/api`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/order` | Create order. **Body:** `firstName`, `lastName`, `userId`, `email`, `address`, `city`, `postalCode`, `cardName`, `cardNumber`, `cardExpiry`, `cardCVV`, `totalPrice`, `items`. Returns 201 + saved order. |
| `GET` | `/api/orders/:userID` | List orders for user. **Params:** `userID` (numeric). Returns 200 + array of orders (newest first). |

## 🗃️ Database Structure
- **Users:** Stores user information (`id`, `name`, `email`, `password`, `role`).
- **Items:** Stores the store products (`id`, `name`, `description`, `postedBy`, `userId`, `price`, `hasImage`, `imageURL`)
- **Orders:** Stores the user placed orders (`id`, `firstName`, `lastName`, `userId`, `email`, `address`, `city`, `postalCode`, `cardName`, `cardNumber`, `expiryDate`, `cvv`, `totalPrice`, `items`)

## 💭 Reflection

Overall, this was our very first MERN stack project MongoDB + Express + React + Node.js of this scale. It was quite the exciting experience being able to utilize the full stack we learned to create a functional E-Commerce platform. Being able to use React + Express really simplifies and makes the code more modular and reusable compared to plain HTML, CSS and JavaScript. Compared to using a JSON list or MySQL, MongoDB felt more modern and compelling because its document-based design allows data to be stored and managed more flexibly.
<br>
Along the way we had many different challenges and successes, mainly with the setup process and the final integration with all the components and the MongoDB database. Though, in the end, with a little bit of patience, thinking, and collaberation we were able to overcome these issues and create a working product. Overall, this was a great experience for us all, and we were all able to contribute well and learn along the way while making this project.

## 💡 Future Enhancements
- Further enhance UI
- Payment Integration
- Additional security features: password hashing, captcha codes, security questions
- User management menu
