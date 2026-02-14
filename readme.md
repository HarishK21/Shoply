<h1>Shoply E-Commerce Site</h1>

<img width="2891" height="1626" alt="image" src="https://github.com/user-attachments/assets/8bc1e344-ee39-40e8-8f70-216f5df7d808" />

## 📜 Overview
Shoply is a community-driven e-commerce platform for buying and selling a large variety of items on the our market. Users can create listings for products, buy products from listings. Admins can manage items and delete them if necessary. 
<br>
In the future, additional functionality could be added, for example, a seperation of permissions for admins and users, adding a database instead of the json, filtering items by type, more robust implementation to add new items, hashing passwords to store more securely, adding security questions and a captcha, payment integration, and manage your listings menu.


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
  - Provide a name, brief description, an image, and a price.
- **Shopping Cart**:
  - Users can add items to their shopping carts and then check out.
  - Users can modify their shopping cart to their needs.
- **Admin Features**:
  - Admins can delete items from the market.
- **Responsive Design**:
  - Works on various devices, ie. Phone, Laptop, Desktop, etc. 

## 🤖 Technologies Used
- **Frontend:** HTML, CSS, React
- **Backend:** Node.js, Express
- **Database:** JSON List

## 🏗️ Documentation
1. Clone the repository: `git clone https://github.com/HarishK21/E-CommercePlatform.git` or for SSH setup: `git clone git@github.com:HarishK21/E-CommercePlatform.git`
2. Open a terminal inside the E-CommercePlatform folder.
3. Move into the Server Directory with `cd server`.
4. Run the commands `npm install`, followed by `node server.js`.
5. Open a second terminal inside the E-CommercePlatform folder
6. Move into the Client Directory with `cd client`.
7. Run the commands `npm install`, followed by `npm run dev`.
8. Access the web application by clicking on the localhost url provided by the terminal.
9. Create an account and use the account to sign in, or use the test login email: `admin521@gmail.com`, password: `521admin521`
10. To reset items state, CTRL+C the server terminal and rerun it with `node server.js` .

## 🗃️ JSON Structure
- **Users:** Stores user information (`id`, `name`, `email`, `password`).
- **Store_Items:** Stores the store products (`id`, `report_id`, `user_id`, `email`, `created_at`)

## 💭 Reflection

Overall, this was our very first full stack React + Express + Node.js of this scale. It was quite the exciting experience being able to utilize the stack we learned to create a functional E-Commerce platform. Being able to use React + Express really simplifies and makes the code more modular and reusable compared to plain HTML, CSS and JavaScript. 
<br>
Along the way we had many different challenges and successes, mainly with the setup process and the final integration with all the components and the JSON file. Though, in the end, with a little bit of patience, thinking, and collaberation we were able to overcome these issues and create a working product. Overall, this was a great experience for us all, and we were all able to contribute well and learn along the way while making this project.

## 💡 Future Enhancements
- Separation of permissions (Admin, User)
- Cleaner UI
- Payment Integration
- Additional security features: Password hashing, captcha codes, security questions
- User management menu
