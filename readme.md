<h1>Shoply E-Commerce Site</h1>

<img width="2891" height="1626" alt="image" src="https://github.com/user-attachments/assets/8bc1e344-ee39-40e8-8f70-216f5df7d808" />

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

## 🏗️ Documentation
1. Clone the repository: `git clone https://github.com/HarishK21/E-CommercePlatform.git` or for SSH setup: `git clone git@github.com:HarishK21/E-CommercePlatform.git`
2. Open a terminal inside the E-CommercePlatform folder.
3. Move into the Frontend Directory with `cd frontend`.
4. Run the commands `npm install`, followed by `npm run dev`.
5. Open a second terminal without closing the first one, inside the E-CommercePlatform folder
6. Move into the Backend Directory with `cd backend`.
7. Ensure you have MongoDB installed locally on your device, if installed, start up the program.
8. Run the commands `npm install`, followed by `node server.js`.
9. Access the web application by clicking on the localhost url provided by the terminal.
10. Create an account and use the account to sign in.

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
