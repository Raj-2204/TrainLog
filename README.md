# 🏋️ LiftLog — Serverless Fitness Tracking Web Application

LiftLog is a serverless fitness tracking web application that allows users to securely log workouts, track exercises with sets, reps, and weight, manage rest periods, and analyze training progress over time. The application is built using a modern cloud-native architecture on AWS and demonstrates key cloud computing concepts such as serverless design, JWT-based authentication, and scalable data modeling.

---

## 🚀 Features

- 🔐 **User Authentication**
  - Secure email/password authentication using Amazon Cognito
  - JWT-based authorization for all backend API requests

- 🏋️ **Workout Sessions**
  - Start and complete workout sessions
  - Assign custom workout titles (e.g., “Chest Day”)
  - Prevent workout completion until at least one set is saved

- 📊 **Exercise & Set Tracking**
  - Choose exercises from a predefined catalog
  - Log sets with reps and weight (lbs)
  - Edit or delete unsaved sets
  - Automatically compute total volume per workout

- ⏱️ **Rest Timer**
  - Rest timer starts at 0 and counts upward
  - Controls to start, stop, and reset rest timing
  - Rest timer linked to specific exercises

- 📈 **Analytics & History**
  - View completed workout history grouped by date
  - Display total sets and volume per workout
  - Weekly volume bar chart with daily drill-down

- 🧭 **Clean UI**
  - Tab-based navigation: Home, Exercises, Workout, History
  - Responsive and minimal design focused on usability

---

## 🏗️ Architecture Overview

LiftLog uses a fully serverless architecture on AWS:

- **Frontend:** React (Vite)
- **Authentication:** Amazon Cognito (User Pool + JWT)
- **API Layer:** Amazon API Gateway (HTTP API)
- **Backend:** AWS Lambda (Node.js)
- **Database:** Amazon DynamoDB (single-table design)

### High-Level Flow

1. User signs in via Amazon Cognito
2. Cognito issues a JWT
3. React frontend sends JWT with API requests
4. API Gateway validates JWT using a Cognito authorizer
5. AWS Lambda processes requests
6. DynamoDB stores and retrieves workout data

---

## 🗄️ Database Design (DynamoDB)

LiftLog uses a **single-table DynamoDB design** to efficiently store all entities:

| PK | SK | Description |
|----|----|------------|
| `USER#<sub>` | `SESSION#<date>#<id>` | Workout session |
| `USER#<sub>` | `SET#<sessionId>#<exerciseId>#<setNumber>` | Exercise set |
| `CATALOG` | `EXERCISE#<id>` | Exercise catalog item |

This design:
- Avoids joins
- Scales efficiently
- Enables fast queries by user and session

---

## 🔐 Security Considerations

- JWTs are validated at API Gateway (not in Lambda)
- No secrets are stored in the frontend
- All backend access is protected by Cognito authorizers
- IAM roles follow the principle of least privilege

---

## 🧠 Challenges & Solutions

- **CORS Issues:** Resolved by configuring Lambda responses and API Gateway
- **JWT Claim Extraction:** Handled via Cognito authorizer context
- **React Hook Errors:** Fixed by restructuring hook usage inside components
- **Workout Analytics Accuracy:** Volume and set counts are computed at workout completion

---

## 🤖 AI Usage Disclosure

AI tools (ChatGPT) were used as a learning aid to understand AWS services, debug issues, and refine implementation ideas. All code and architectural decisions were implemented, tested, and fully understood by the author.

---

## 📦 Deployment (Optional)

The frontend can be deployed using:
- Amazon S3 (static website hosting)
- Amazon CloudFront (CDN + HTTPS)

The backend runs entirely on AWS-managed serverless services.

---

## 📚 Technologies Used

- React (Vite)
- AWS Amplify (Auth only)
- Amazon Cognito
- Amazon API Gateway
- AWS Lambda (Node.js)
- Amazon DynamoDB
- JavaScript / HTML / CSS

---

## ✅ Conclusion

LiftLog demonstrates the practical application of cloud computing principles through a real-world, serverless web application. The project highlights authentication, scalability, security, and data modeling while delivering a functional fitness tracking experience.
