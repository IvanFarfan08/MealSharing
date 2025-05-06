# MealSharing App

A React Native mobile application that connects people through shared meals. Users can host meals or find meals hosted by others in their community. 

## Technologies Used

- React Native + TypeScript
- Supabase
- Stripe API

## Contributors & Responsibilities

### Milestone 3

- **Ivan Farfan**  
  Authentication and database management service implementation. Created the project structure and database schema.

- **Johan Jaramillo**  
  Improved the log in and account creation UI, including the addition of smooth transitions and Lottie animations. Designed and implemented the "Host a Meal" feature, enabling users to create and publish meal events with full details such as location, date, courses, and pricing.

- **Ryan Davis**  
  Set up Stripe API integration based on the "Find Meals" page. Implemented bug fixes where needed and provided documentation for the milestone.

- **Cory Vitanza**  
  Updated the "Find Meals" page layout and functionality. Implemented bug fixes for miscellaneous errors/bugs.
  
### Milestone 4

- **Ryan Davis**  
  Implemented request logic allowing guests to request joining a meal and hosts to approve the request.

- **Ivan Farfan**  
  Manages Supabase DB. Implemented guest’s ability to browse meals based on location, time, and meal information.

- **Johan Jaramillo**  
  Implemented rating system for users and hosts, as well as hosts rejecting a guest’s join request.

- **Cory Vitanza**  
  Focused on documentation. Performed bug testing/fixing.

### Milestone 5

- **Ryan Davis**  
  --update

- **Ivan Farfan**  
  --update

- **Johan Jaramillo**  
  Implemented host meal cancellations and the notification center for meal status updates.

- **Cory Vitanza**  
  Focused on documentation. Performed bug testing/fixing.

## Features and Functions

- **User Authentication**: User registration and login.
- **Meal Discovery**: Users can find meals hosted by others in their nearby area.
  - **Meal Requesting**: Users can request to join meals created by hosts.
- **Meal Hosting**: Users can host meals for others to join.
  - **Meal Accepting / Declining**: Hosts can accept / deny users from their meal.
  - **Cancel or Reschedule Meals**: Hosts can cancel or reschedule meals.
  - **Manage Guests**: Hosts can view and manage guests for each meal.
- **Host / Guest Rating**: Users can rate their experience of the meal on a per-user basis.
- **Guest Features**:
  - **Cancel Join Request**: Guests can cancel a join request if it has not yet been accepted.
  - **View Meal History**: Guests can view request history and upcoming meals.
  - **In-App Notifications**: Guests receive updates for request outcomes.
- **System Features**:
  - **Notification Center**: Centralized updates for meal status and user actions.
  - **Edge Case Handling**: System manages cases like full meals and rejoining canceled ones.


## Features (Project) Board

Interested individuals can view the project board on [GitHub Projects](https://github.com/users/IvanFarfan08/projects/5) where we specify our functions to be implemented.

## Functions not Implemented

The app currently has no implementation of the Stripe API, as it was not necessary at any stage in development so far to implement a payment system. Also, while mock services are implemented, the app does not support an email notification system for users. Instead, the app contains its own notification system for users to view and manage their requests and updates.

## Prerequisites

- Node.js (v14 or later)
- npm or yarn
- React Native development environment

## Installation

1. Clone the repository
```bash
git clone https://github.com/IvanFarfan08/MealSharing.git
cd MealSharing
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start the development server
```bash
npm start
# or
yarn start
```

4. Run on iOS or Android
```bash
npm run ios
# or
npm run android
```
