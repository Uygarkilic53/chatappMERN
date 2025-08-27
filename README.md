# ChatApp: A Real-Time Chat Application 💬
ChatApp is a modern, real-time chatting application that lets you connect with friends and family. With a user-friendly interface and essential features like real-time messaging, profile customization, and theme switching, it provides a seamless chatting experience.

# ✨ Features
User Authentication: Secure login and registration.

Real-Time Messaging: Instant, two-way communication between users.

User Search: Easily find other users by their email addresses to start a new chat.

Conversation History: Your chats are saved and displayed in a sidebar for easy access.

Profile Management: View and update your profile information.

Theme Toggle: Switch between light and dark modes to suit your preference.

# 💻 Technologies Used
Backend	Frontend
Node.js	React
Express.js	Vite
Socket.IO	Socket.IO-client
MongoDB	CSS
Cloudinary	
JSON Web Token (JWT)	

# 🚀 Getting Started
Follow these steps to set up and run the project on your local machine.

Prerequisites
You'll need to have Node.js and npm installed on your system.

# Installation
1. Clone the repository:
```
git clone https://github.com/uygarkilic53/chatappMERN.git
cd chatappMERN
```
2. Backend Setup:
Navigate to the backend directory and install the dependencies.
```
cd backend
npm install
```
3. Environment Variables:
Create a .env file in the root of the backend folder and add the following variables with your credentials:
```
PORT=3000
MONGODB_URI=<Your MongoDB connection string>
JWT_SECRET=<A strong, random secret key>
NODE_ENV=development
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=<Your Cloudinary cloud name>
CLOUDINARY_API_KEY=<Your Cloudinary API key>
CLOUDINARY_API_SECRET=<Your Cloudinary API secret>
```
You can get the MONGODB_URI from your MongoDB Atlas account, and the Cloudinary credentials from your Cloudinary dashboard.
4.Frontend Setup:
Open a new terminal, navigate to the frontend directory, and install the dependencies.
```
cd ../frontend
npm install
```

# Running the Application
1. Start the Backend Server:
From the backend directory, run the server.

```
npm start
```
2. Start the Frontend Client:
From the frontend directory, run the client.

```
npm run dev
```

3. Open your browser and navigate to http://localhost:5173 to see the application in action.

Enjoy chatting!

🤝 Contributing Feel free to fork the repo, open issues, or submit PRs! Feedback is always welcome.

📬 Contact If you like this project or want to collaborate, feel free to reach out:

GitHub: uygarkilic53 LinkedIn: (https://www.linkedin.com/in/uygar-k%C4%B1l%C4%B1%C3%A7-5700761a9/)





