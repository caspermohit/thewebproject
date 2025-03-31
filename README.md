# Web Project

A modern web application for facilitating donations and item browsing with integrated mapping and messaging features.

## Features

- 🔐 User Authentication
  - Login/Register
  - Password Recovery
  - Profile Management

- 📦 Core Functionality
  - Item Browsing and Search
  - Donation Management
  - Interactive Map Integration
  - Real-time Messaging
  - Notification System

- 💅 User Interface
  - Responsive Design
  - Modern Card-based Layout
  - Clean Navigation

## Project Structure

```
src/
├── assets/
│   └── css/
│       ├── 02-molecules/
│       │   ├── _cards.css
│       │   └── _navigation.css
│       ├── main.css
│       └── styles.css
└── pages/
    ├── auth/
    │   ├── login.html
    │   ├── register.html
    │   └── forgot-password.html
    └── main/
        ├── browse.html
        ├── donate.html
        ├── history.html
        ├── item-details.html
        ├── map.html
        ├── messages.html
        ├── notifications.html
        ├── profile.html
        ├── search-results.html
        └── settings.html
```

## Getting Started

1. Clone the repository
2. Open `index.html` in your web browser
3. For development, use a local web server to avoid CORS issues

## Development

This project uses vanilla HTML, CSS, and JavaScript. The CSS is organized using a modular approach with separate files for different components.

### CSS Structure
- `main.css`: Primary stylesheet
- `styles.css`: Global styles
- `02-molecules/`: Component-specific styles
  - `_cards.css`: Styles for card components
  - `_navigation.css`: Navigation-related styles

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the Group-4.
## JavaScript Structure
```
src/assets/js/
├── modules/
│   ├── auth.js       # Auth Service (Mohit Shah)
│   ├── items.js      # Items Service (Sudheer)
│   ├── map.js        # Map Service (Zia Sheikh)
│   ├── messages.js   # Messages Service (Rupesh Gaur)
│   └── ui.js         # UI Handler (Goutam Yadav)
└── pages/
    ├── auth/
    │   ├── login.js      # Login Page (Mohit Shah)
    │   └── register.js   # Registration Page (Mohit Shah)
    ├── main/
    │   ├── browse.js     # Browse Items (Sudheer)
    │   ├── donate.js     # Donate Items (Sudheer)
    │   ├── history.js    # Donation History (Sudheer)
    │   ├── home.js       # Home Page (Mohit Shah)
    │   ├── item-details.js # Item Details (Mohit Shah)
    │   ├── map.js        # Map View (Zia Sheikh)
    │   ├── messages.js   # Messages Page (Rupesh Gaur)
    │   ├── notifications.js # Notifications (Rupesh Gaur)
    │   ├── profile.js    # User Profile (Mohit Shah)
    │   ├── search-results.js # Search Results (Sudheer)
    │   └── dashboard.js  # Admin Dashboard (Mohit Shah)
```

## Team Member Contributions
- Mohit Shah: Authentication system, user profile management, login/register functionality, password recovery, and session management
- Sudheer: Item donation system, item management, item status updates, item search and filtering, and item categories
- Zia Sheikh: Interactive map integration, location services, geocoding, map markers and clustering, and distance calculations
- Rupesh Gaur: Real-time messaging system, chat functionality, message notifications, conversation management, and message history
- Goutam Yadav: UI components, animations and transitions, form validations, modal dialogs, and toast notifications
